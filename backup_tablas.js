const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY son requeridas.');
  console.error('Configuralas como Secrets en el repositorio de GitHub.');
  process.exit(1);
}

async function getAllTables() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': supabaseKey }
    });
    const data = await res.json();
    if (!data.definitions) return [];
    
    // Las tablas están en data.definitions (las properties)
    const tables = Object.keys(data.definitions).filter(t => data.definitions[t].type !== 'rpc');
    return tables;
  } catch (err) {
    console.error('Error al obtener la lista de tablas:', err.message);
    return [];
  }
}

async function fetchAllData(tableName) {
  let allData = [];
  let from = 0;
  const limit = 1000;
  let keepFetching = true;

  while (keepFetching) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Range': `${from}-${from + limit - 1}`
        }
      });
      
      if (!res.ok) {
        console.error(`Error HTTP ${res.status} al descargar ${tableName}:`, await res.text());
        break;
      }

      const data = await res.json();
      
      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += limit;
        if (data.length < limit) keepFetching = false;
      } else {
        keepFetching = false;
      }
    } catch (err) {
      console.error(`Error al descargar ${tableName}:`, err.message);
      break;
    }
  }

  return allData;
}

async function backupDatabase() {
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('Iniciando proceso de backup mediante API REST...');
  
  const tables = await getAllTables();
  console.log(`Tablas encontradas: ${tables.join(', ')}`);

  for (const table of tables) {
    console.log(`[Backup] Descargando datos de la tabla: ${table}...`);
    const data = await fetchAllData(table);
    
    // Save to JSON
    const filePath = path.join(backupDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[+] Guardado ${data.length} registros en backups/${table}.json`);
  }

  console.log('Backup completado con éxito.');
}

backupDatabase();
