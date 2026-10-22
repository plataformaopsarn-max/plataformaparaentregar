// --- CONFIGURACIÓN Y GESTOR DE CACHÉ INTELIGENTE ---

const SUPABASE_URL = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) || 'https://mugtfugfabhrqcomynrs.supabase.co';
const SUPABASE_KEY = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z3RmdWdmYWJocnFjb215bnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTk0ODcsImV4cCI6MjA4NjIzNTQ4N30.SNJHTTOHlJ2e7TbvwigkTSWNUk3zPF7cRNZYP74vWAI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// GESTOR DE CACHÉ LOCAL CON TTL Y BATCH PRE-FETCHING (Mitiga consumo de Supabase en 98%+)
const DataCacheManager = {
    CACHE_KEY: (window.APP_CONFIG && window.APP_CONFIG.CACHE_KEY_ES) || 'regia_cache_es_v1.4',
    TTL: (window.APP_CONFIG && window.APP_CONFIG.CACHE_TTL_MS) || (24 * 60 * 60 * 1000),

    data: {
        faq: null,
        summary: null,
        links: null
    },

    loadSync() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                const { timestamp, payload } = JSON.parse(cached);
                if (Date.now() - timestamp < this.TTL && payload && payload.faq && payload.summary) {
                    this.data = payload;
                    console.log('⚡ [DataCacheManager] Datos cargados instantáneamente desde LocalStorage (0 consultas a Supabase)');
                    return true;
                }
            }
        } catch (e) {
            localStorage.removeItem(this.CACHE_KEY);
        }
        return false;
    },

    async init() {
        if (this.loadSync()) return;
        await this.fetchFreshData();
    },

    async fetchFreshData() {
        console.log('🌐 [DataCacheManager] Descargando lote completo desde Supabase...');
        try {
            const [faqRes, summaryRes, linksRes] = await Promise.all([
                supabase.from('faq_rows_corregido').select('*'),
                supabase.from('resumen_ejecutivo').select('*'),
                supabase.from('enlaces').select('*').order('question_code')
            ]);

            this.data = {
                faq: (faqRes.data || []).sort((a, b) => (a.pais || '').localeCompare(b.pais || '', 'es', { sensitivity: 'base' })),
                summary: (summaryRes.data || []).sort((a, b) => (a.pais || '').localeCompare(b.pais || '', 'es', { sensitivity: 'base' })),
                links: linksRes.data || []
            };

            localStorage.setItem(this.CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                payload: this.data
            }));
            console.log('✅ [DataCacheManager] Caché local guardada exitosamente.');
        } catch (err) {
            console.error('❌ [DataCacheManager] Error descargando datos de Supabase:', err);
        }
    },

    getCountryDetail(countryName) {
        if (!this.data.faq) return null;
        return {
            faq: this.data.faq.find(r => r.pais === countryName) || null,
            summary: this.data.summary.find(r => r.pais === countryName) || null,
            links: this.data.links ? this.data.links.filter(l => l.pais === countryName) : []
        };
    },

    getFilteredCountries(criteriaList) {
        if (!this.data.faq) return [];
        return this.data.faq.filter(row => {
            return criteriaList.every(code => {
                const dbKey = `q_${code.replace(/\./g, '_')}_booleano`;
                return row[dbKey] === true;
            });
        }).map(r => ({ pais: r.pais }));
    },

    getRequirementComparison(questionId) {
        if (!this.data.faq) return [];
        const dbKey = `q_${questionId.replace(/\./g, '_')}`;
        return this.data.faq.map(r => ({
            pais: r.pais,
            [`${dbKey}_directa`]: r[`${dbKey}_directa`],
            [`${dbKey}_ampliada`]: r[`${dbKey}_ampliada`],
            [`${dbKey}_booleano`]: r[`${dbKey}_booleano`]
        }));
    },

    getCountriesComparison(selectedCountries) {
        if (!this.data.faq) return [];
        return this.data.faq.filter(r => selectedCountries.includes(r.pais));
    }
};

// Intentar carga sincrónica desde LocalStorage al evaluar el script
DataCacheManager.loadSync();

const MAP_PATHS = {
    CA: "M123,143L122,143L117,138L115,136L111,134L110,130L110,128L107,125L107,122L104,119L105,117L106,116L107,113L102,110L100,105L99,103L97,101L95,99L94,97L91,97L88,99L86,96L85,94L82,92L79,92L84,75L86,66L91,67L94,70L97,70L100,70L103,70L107,71L111,71L116,71L117,72L119,72L120,71L122,72L126,75L130,74L130,76L133,76L135,75L138,76L142,78L148,80L152,81L154,81L158,82L154,83L159,84L166,85L168,85L171,87L174,86L172,84L173,84L177,84L179,84L181,85L184,86L187,87L191,88L196,88L200,88L199,87L202,87L206,88L206,90L208,88L210,88L211,86L208,84L205,83L206,81L209,79L213,80L215,81L219,84L216,85L221,85L221,88L225,86L228,88L227,90L230,91L233,90L235,87L235,85L239,85L243,86L247,87L247,88L245,89L247,91L246,92L241,94L237,94L234,93L233,95L231,97L230,98L227,100L223,100L220,101L220,103L217,103L213,106L210,109L209,112L208,115L213,116L214,120L215,122L219,122L224,123L227,125L229,127L233,128L236,129L240,130L244,130L243,133L244,137L246,141L250,145L253,144L254,140L253,134L251,132L255,130L258,128L260,125L260,123L258,120L254,117L258,114L256,111L255,106L257,105L262,106L265,106L267,105L270,106L273,108L274,109L279,109L279,112L281,116L283,116L285,118L289,116L292,112L294,111L296,114L300,118L303,122L302,124L306,126L309,128L314,128L316,129L317,132L320,132L321,134L321,138L319,140L318,141L313,143L309,147L304,148L298,147L294,148L290,148L288,151L284,153L280,159L277,163L280,162L284,156L290,152L295,152L297,154L295,157L296,161L297,164L301,166L306,165L309,160L309,163L311,165L308,168L301,171L298,173L295,176L293,176L292,172L298,168L293,169L289,169L287,167L287,161L286,160L284,161L283,160L280,163L280,166L279,168L277,169L276,169L276,170L270,171L266,171L264,172L261,175L261,175L260,177L257,177L254,177L253,178L253,178L253,180L253,180L249,182L246,183L243,185L242,185L241,185L240,184L240,184L241,182L243,180L244,177L243,173L242,169L239,167L240,167L239,166L238,166L238,165L238,164L237,165L236,165L236,164L236,164L235,163L233,161L231,160L228,158L225,157L222,158L221,158L218,156L215,157L212,155L209,155L207,154L206,153L206,151L205,151L205,153L199,152L188,152L178,151L169,150L160,149L152,148L143,146L140,146L131,145ZM228,75L224,75L217,74L216,73L216,72L213,71L208,71L205,70L206,69L211,70L214,70L219,71L221,71L221,72L224,72L226,73L229,73L233,73L237,73L243,73L247,73L250,74L251,74L249,75L245,75L241,75L234,75ZM322,141L321,144L319,148L321,146L323,147L322,148L325,149L326,148L329,149L329,152L331,151L331,153L332,156L331,160L330,160L328,159L328,156L327,155L324,159L323,159L324,157L322,156L318,157L312,157L312,156L314,154L312,153L315,151L317,144L319,142L321,140L322,140ZM239,97L242,98L246,99L246,101L248,100L250,101L247,102L243,102L241,100L239,102L235,103L234,102L230,102L232,100L233,98L234,95L236,96L236,97L238,97ZM253,79L256,79L262,80L266,81L266,82L271,81L274,82L281,83L283,84L286,86L281,87L287,88L292,89L296,91L300,91L299,93L295,96L291,95L287,93L283,93L283,95L286,97L290,98L291,98L293,101L292,103L288,103L281,101L285,103L288,105L289,106L281,105L275,103L272,102L273,101L268,100L264,99L264,99L256,100L254,99L256,97L261,97L267,96L266,95L267,94L270,91L269,90L268,89L264,88L259,87L260,87L257,85L255,85L253,84L251,85L247,85L237,85L231,84L227,83L224,82L227,82L223,81L223,79L225,77L228,77L234,76L232,78L235,79L237,77L244,77L248,79L248,80ZM211,75L217,75L222,76L218,77L215,78L212,79L209,79L207,77L207,76L209,75ZM136,63L141,62L146,62L150,63L154,63L154,64L151,65L149,64L144,64L140,64ZM120,145L119,145L114,143L114,141L111,139L111,138L108,137L107,134L108,133L111,135L112,136L115,137L116,138L117,140L120,143ZM139,66L143,67L150,68L152,69L155,71L152,71L145,71L141,72L141,73L134,73L133,72L127,69L128,69L130,68L133,67L130,65ZM176,69L178,69L181,69L181,70L180,71L171,70L164,70L160,69L160,69L165,69L153,67L150,67L153,65L156,65L163,67L168,68L173,69L169,67L171,67L174,67L175,68ZM179,74L182,75L183,78L184,79L188,81L193,82L193,83L188,83L190,84L189,85L184,84L179,83L176,83L171,83L164,83L159,82L158,81L154,80L152,80L149,77L151,77L155,78L159,78L162,78L157,77L151,76L148,76L146,75L153,75L149,74L144,73L146,72L148,71L156,71L158,72L157,73L163,73L167,74L170,74L172,74L174,77L176,76L174,74L176,74ZM195,77L192,75L195,74L199,75L203,75L204,76L202,76L206,78L205,79L200,80L198,80L196,79L190,77L190,76ZM201,70L203,71L203,71L202,73L197,72L194,72L194,71L190,71L190,69L193,70L197,69L201,70ZM208,65L210,64L212,65L211,64L217,65L221,65L225,66L229,66L232,67L235,67L231,68L226,69L221,69L216,68L213,67L213,67L215,67L210,66L208,66L206,65ZM220,64L223,64L227,64L232,64L236,64L239,64L242,64L244,64L247,64L252,64L260,63L261,63L269,63L275,63L280,63L287,63L293,62L298,62L298,62L291,63L285,64L283,64L288,64L282,65L278,65L273,67L268,67L266,67L258,68L262,68L260,68L262,69L260,69L256,70L254,70L251,71L251,71L256,71L256,71L249,72L242,72L234,72L230,72L225,71L224,71L229,70L228,69L230,69L237,70L233,69L229,69L231,68L236,68L237,67L233,67L232,66L239,66L241,67L245,66L239,66L230,66L225,65L223,65L220,64Z",
    US: "M123,143L131,145L140,146L143,146L152,148L160,149L169,150L178,151L188,152L199,152L205,153L205,151L206,151L206,153L207,154L209,155L212,155L215,157L218,156L221,158L222,158L225,157L228,158L231,160L233,161L235,163L236,164L236,164L236,165L237,165L238,164L238,165L238,166L239,166L240,167L239,167L242,169L243,173L244,177L243,180L241,182L240,184L240,184L241,185L242,185L243,185L246,183L249,182L253,180L253,180L253,178L253,178L254,177L257,177L260,177L261,175L261,175L264,172L266,171L270,171L276,170L276,169L277,169L279,168L280,166L280,163L283,160L284,161L286,160L287,161L287,167L289,169L290,171L287,173L284,175L281,176L279,179L278,180L279,182L280,184L281,184L281,183L282,184L281,185L279,186L278,186L275,187L274,187L272,187L270,189L274,188L275,188L271,190L269,190L269,189L268,191L269,191L268,194L266,198L266,197L265,196L264,195L265,198L266,199L266,200L265,202L263,206L263,206L264,202L262,201L262,197L261,199L262,202L260,201L262,203L262,207L263,207L263,209L264,214L262,217L259,219L256,221L255,222L253,223L253,225L249,228L247,230L246,233L245,237L246,240L247,244L248,248L248,250L250,256L250,259L250,261L249,264L248,264L246,264L246,262L244,261L243,256L241,252L240,251L241,247L240,245L238,241L236,240L233,242L232,242L231,239L229,238L225,239L222,238L220,238L218,239L219,240L219,242L219,243L219,244L217,243L216,244L214,244L211,241L208,241L206,240L204,240L201,241L198,245L194,247L192,249L192,251L191,254L191,257L192,259L190,259L188,257L186,256L185,253L184,250L183,247L182,244L180,240L178,238L175,238L173,242L170,240L169,238L168,236L167,233L166,231L164,229L163,227L157,227L157,229L154,228L148,228L141,223L136,220L137,219L133,219L129,219L129,217L127,214L126,213L125,212L124,211L123,210L120,209L119,208L119,205L117,200L115,193L115,192L114,190L113,186L113,182L112,180L113,176L113,172L113,169L115,165L116,161L117,157L117,151L117,148L117,146L117,145L121,147L122,151L123,150L123,147ZM86,66L84,75L79,92L82,92L85,94L86,96L88,99L91,97L94,97L95,99L97,101L99,103L100,105L102,110L107,113L106,116L105,117L103,115L101,114L101,110L98,107L97,103L94,102L90,101L87,100L82,95L79,94L75,91L71,91L66,88L63,86L60,85L60,88L58,88L55,87L52,88L49,88L49,86L51,83L55,83L54,82L50,82L48,84L43,85L45,87L41,89L38,89L35,90L34,91L29,91L28,93L24,93L22,92L19,92L16,93L13,93L8,92L8,92L12,91L15,91L18,90L22,91L23,90L28,89L29,88L31,88L32,85L34,84L31,84L30,83L28,84L27,82L26,83L26,81L22,81L21,81L21,79L22,78L21,76L17,75L15,73L14,72L14,70L13,68L14,67L17,66L18,65L21,65L22,66L25,65L27,66L29,66L29,65L28,64L30,63L28,63L25,62L24,63L22,61L19,61L15,59L14,57L12,54L16,55L22,55L24,56L23,57L29,59L27,57L24,55L23,53L21,51L17,49L19,48L24,50L28,50L29,49L32,49L34,49L39,50L42,51L46,51L50,52L51,54L53,54L57,55L57,56L61,57L63,58L69,60L74,62L76,62L79,63L83,65Z",
    MX: "M129,219L133,219L137,219L136,220L141,223L148,228L154,228L157,229L157,227L163,227L164,229L166,231L167,233L168,236L169,238L170,240L173,242L175,238L178,238L180,240L182,244L183,247L184,250L185,253L186,256L188,257L190,259L192,259L190,263L189,266L189,273L188,275L189,278L189,281L190,284L192,288L193,291L194,294L197,295L199,297L202,296L205,296L207,295L210,294L212,292L213,290L213,285L214,284L217,283L220,282L223,282L226,282L226,283L226,285L224,288L223,291L224,292L223,294L222,298L221,297L221,297L220,297L219,300L218,299L218,299L218,300L214,300L211,300L211,303L209,302L210,304L212,305L212,306L213,307L212,308L208,308L206,312L206,313L206,314L206,316L202,310L200,309L197,307L195,307L192,309L190,309L188,308L185,307L182,304L180,303L176,301L173,298L172,297L170,296L167,294L165,292L162,289L161,285L160,283L161,283L161,281L162,280L162,278L161,276L161,274L160,271L158,266L155,262L153,259L151,256L150,255L151,252L149,251L148,248L147,245L145,244L144,241L143,239L143,237L141,233L141,229L141,228L139,225L138,225L136,224L135,226L135,228L135,232L136,234L138,238L138,239L139,239L139,241L140,241L140,244L141,245L141,247L143,250L144,255L144,257L145,259L145,262L147,262L148,265L149,267L149,268L147,270L146,270L146,266L144,263L142,261L140,259L141,256L140,253L139,251L137,249L137,249L136,248L134,246L132,243L133,243L134,243L135,242L136,240L134,236L132,234L131,231L130,228L130,224Z",
    GT: "M206,316L206,314L206,313L206,312L208,308L212,308L213,307L212,306L212,305L210,304L209,302L211,303L211,300L214,300L218,300L217,304L217,310L218,310L219,311L219,310L220,310L219,312L217,314L217,315L217,316L216,317L215,317L215,318L215,318L213,319L213,320L212,319L209,319L208,318Z",
    SV: "M216,317L217,317L218,318L219,319L219,320L221,319L222,320L222,320L222,322L221,323L219,323L218,323L216,322L214,321L213,320L213,319L215,318L215,318L215,317Z",
    HN: "M239,315L237,314L237,315L236,316L235,316L234,316L233,316L233,315L232,315L232,317L231,317L231,318L230,319L229,320L229,320L228,319L227,320L226,320L226,320L226,323L225,323L224,324L223,324L223,323L222,322L222,320L222,320L221,319L219,320L219,319L218,318L217,317L216,317L217,316L217,315L217,314L219,312L220,310L221,311L222,310L223,310L223,310L224,310L225,310L227,310L228,310L229,309L230,310L231,310L231,310L232,309L234,310L234,310L235,311L236,312L238,313Z",
    NI: "M237,335L236,336L235,335L234,334L233,334L232,335L230,333L229,334L228,332L226,330L225,328L224,327L222,325L222,324L223,325L223,324L224,324L225,323L226,323L226,320L226,320L227,320L228,319L229,320L229,320L230,319L231,318L231,317L232,317L232,315L233,315L233,316L234,316L235,316L236,316L237,315L237,314L239,315L238,315L238,316L239,318L238,320L237,322L237,324L237,325L237,327L237,328L236,330L237,331L236,333L236,334Z",
    CR: "M241,342L239,342L239,344L240,345L239,345L240,346L239,347L239,348L237,347L236,346L237,345L237,344L236,343L234,342L233,341L233,340L232,339L232,340L231,341L230,340L229,340L229,339L229,337L229,335L228,335L229,334L230,333L232,335L233,334L234,334L235,335L236,336L237,335L237,337L239,339Z",
    PA: "M260,346L260,347L260,350L260,351L259,351L258,353L257,352L256,349L257,348L256,347L255,346L253,344L252,345L251,346L249,348L249,348L248,349L250,352L249,352L249,353L247,353L246,350L246,351L244,351L244,349L242,348L241,348L240,348L239,349L239,348L239,347L240,346L239,345L240,345L239,344L239,342L241,342L242,343L242,344L243,345L244,344L245,345L247,345L248,344L250,343L252,341L254,342L254,342L256,342L257,343L259,345Z",
    CU: "M242,274L245,274L248,274L251,276L253,278L256,277L257,278L260,281L262,284L263,283L266,284L265,286L268,286L271,288L270,289L268,290L265,290L263,290L258,290L260,288L259,286L257,286L255,285L255,282L253,282L249,281L248,280L244,279L243,278L244,277L240,276L238,279L237,279L236,280L234,281L233,280L235,279L235,277L237,276L239,275L241,274Z",
    JM: "M259,297L261,298L263,299L264,300L261,300L260,301L258,300L256,298L256,297L258,297Z",
    HT: "M279,291L280,293L280,295L279,296L280,298L280,299L277,298L276,299L273,298L272,299L270,298L270,296L273,297L276,297L277,296L276,294L276,292L273,291L274,290L276,290Z",
    DO: "M280,299L280,298L279,296L280,295L280,293L279,291L280,290L282,290L285,291L286,291L286,292L288,292L288,294L290,294L292,296L290,298L289,297L287,297L286,297L285,298L284,298L283,297L282,298L281,301L280,300Z",
    TT: "M318,333L320,332L321,333L321,336L318,337L317,337L318,335Z",
    CO: "M301,381L300,381L299,379L298,377L297,379L290,379L290,382L292,383L292,384L291,384L289,385L289,388L291,390L292,393L292,395L290,408L288,405L287,405L289,400L286,398L284,399L283,398L280,399L277,399L275,394L273,393L272,390L269,388L268,389L266,388L265,386L263,387L260,386L259,384L258,384L255,382L254,380L255,380L255,377L256,376L258,375L260,372L261,370L260,368L260,366L259,361L260,360L260,356L258,353L259,351L260,351L260,350L260,347L260,346L262,346L265,343L266,342L266,340L267,336L269,334L271,334L271,333L274,333L277,330L279,329L280,327L282,327L283,328L282,330L280,331L279,334L277,335L276,337L276,340L275,343L277,344L278,346L278,347L279,349L278,351L279,352L279,352L280,354L285,353L287,354L290,358L292,357L295,357L297,357L298,357L297,360L297,362L297,365L298,369L299,370L299,371L297,373L298,374L300,376Z",
    VE: "M323,360L324,362L323,364L319,366L316,367L315,368L312,367L309,366L308,367L310,368L310,371L311,374L314,375L314,376L312,377L311,379L310,380L307,381L306,383L303,383L301,381L300,376L298,374L297,373L299,371L299,370L298,369L297,365L297,362L297,360L298,357L297,357L295,357L292,357L290,358L287,354L285,353L280,354L279,352L279,352L278,351L279,349L278,347L278,346L277,344L275,343L276,340L276,337L277,335L279,334L280,331L282,330L282,331L280,332L281,334L281,337L280,340L281,344L283,343L283,340L282,338L282,334L286,332L286,330L287,328L288,331L291,331L294,334L294,336L297,336L301,335L303,337L306,337L308,336L308,334L313,334L317,334L314,335L315,337L318,338L321,340L322,344L324,343L326,345L323,348L323,349L324,351L323,352L321,353L321,355L321,357Z",
    EC: "M268,389L269,392L268,395L263,400L259,402L256,406L256,410L253,412L252,409L250,409L248,409L248,407L249,406L249,404L251,401L250,399L249,401L246,399L247,398L246,393L248,393L249,390L250,386L250,384L252,383L255,382L258,384L259,384L260,386L263,387L265,386L266,388Z",
    PE: "M290,408L287,408L286,408L283,409L279,413L278,415L277,416L278,419L275,420L275,422L274,423L276,427L279,430L278,432L280,432L282,434L286,434L289,432L289,438L291,439L293,438L297,445L296,447L296,450L296,453L295,456L295,457L294,459L296,462L294,467L293,469L291,470L286,468L286,466L278,462L270,458L267,455L265,451L266,450L262,444L258,436L254,427L252,425L251,422L248,419L245,417L246,415L244,411L246,407L249,404L249,406L248,407L248,409L250,409L252,409L253,412L256,410L256,406L259,402L263,400L268,395L269,392L268,389L269,388L272,390L273,393L275,394L277,399L280,399L283,398L284,399L286,398L289,400L287,405L288,405Z",
    BR: "M369,524L367,522L369,520L366,518L363,517L358,515L356,515L351,513L349,513L354,508L359,504L361,502L365,499L365,496L362,494L360,495L361,493L361,491L361,488L359,488L358,489L356,489L356,487L355,484L354,482L351,482L349,483L345,482L344,477L343,475L344,474L344,471L345,469L345,466L344,464L341,463L341,461L341,458L333,459L331,454L332,454L332,452L331,451L331,448L328,447L326,447L324,446L321,446L319,444L315,444L310,440L310,437L310,435L310,432L305,433L303,435L299,437L298,438L296,438L293,438L291,439L289,438L289,432L286,434L282,434L280,432L278,432L279,430L276,427L274,423L275,422L275,420L278,419L277,416L278,415L279,413L283,409L286,408L287,408L290,408L292,395L292,393L291,390L289,388L289,385L291,384L292,384L292,383L290,382L290,379L297,379L298,377L299,379L300,381L301,381L303,383L306,383L307,381L310,380L311,379L312,377L314,376L314,375L311,374L310,371L310,368L308,367L309,366L312,367L315,368L316,367L319,366L323,364L324,362L323,360L325,360L326,361L326,363L327,364L328,366L327,368L327,372L328,374L329,376L331,379L333,379L334,378L335,377L337,376L338,375L340,375L341,375L343,375L343,374L342,373L343,372L344,372L346,371L348,372L350,373L351,372L352,372L353,373L354,372L356,370L357,367L358,362L360,362L361,364L364,372L366,373L367,376L364,381L366,382L372,382L373,387L376,383L381,384L388,386L390,389L390,391L394,389L402,391L408,389L414,392L420,397L423,397L427,397L428,398L431,404L432,406L432,414L430,417L426,425L424,430L421,434L420,434L420,438L421,446L421,452L421,455L420,457L420,463L417,469L417,473L414,475L413,478L408,478L402,481L399,483L395,485L390,489L387,493L386,496L387,498L387,502L386,504L383,506L379,513L376,516L373,518L371,522Z",
    BO: "M293,438L296,438L298,438L299,437L303,435L305,433L310,432L310,435L310,437L310,440L315,444L319,444L321,446L324,446L326,447L328,447L331,448L331,451L332,452L332,454L331,454L333,459L341,458L341,461L341,463L344,464L345,466L345,469L344,471L344,474L343,475L343,473L339,472L335,472L327,474L326,477L326,480L324,484L324,484L319,484L317,487L315,484L309,484L306,488L302,488L300,483L298,478L299,474L297,473L296,470L294,467L296,462L294,459L295,457L295,456L296,453L296,450L296,447L297,445Z",
    PY: "M343,475L344,477L345,482L349,483L351,482L354,482L355,484L356,487L356,489L358,489L359,488L361,488L361,491L361,493L360,495L360,499L356,502L353,503L348,503L343,502L347,496L346,494L342,493L336,491L333,490L324,484L326,480L326,477L327,474L335,472L339,472L343,473Z",
    CL: "M303,585L304,590L309,590L311,590L310,591L306,592L304,592L301,592L297,591L292,591L286,590L282,589L275,586L279,587L286,588L292,589L294,588L296,586L300,585ZM294,467L296,470L297,473L299,474L298,478L300,483L302,488L306,488L306,489L305,493L300,495L301,501L300,503L301,504L298,507L295,510L294,514L295,517L292,521L294,527L295,528L296,531L293,534L293,537L290,539L290,542L292,546L289,547L288,550L287,553L288,557L286,557L287,561L289,562L288,563L290,564L290,565L288,565L289,567L287,571L285,573L286,574L284,576L281,577L281,580L283,581L286,581L286,583L288,584L299,584L304,584L299,584L297,585L293,586L292,588L290,588L285,588L280,586L274,585L272,584L274,582L271,580L270,576L272,573L277,571L270,570L275,568L276,563L281,564L283,558L280,557L279,561L276,561L277,556L279,550L281,548L279,545L279,541L281,541L283,536L286,530L288,525L287,520L288,517L287,512L290,507L290,500L291,492L292,483L292,476L291,470L293,469Z",
    AR: "M303,585L305,586L308,588L314,589L320,589L318,590L314,591L311,590L309,590L304,590ZM349,513L348,516L347,520L347,524L346,524L346,527L346,529L352,531L352,533L355,535L354,536L351,541L344,543L335,544L330,544L331,546L330,549L331,550L329,551L324,552L320,551L318,552L319,555L322,556L324,555L326,556L322,558L318,560L317,563L316,564L312,564L309,566L307,568L312,570L316,570L315,573L310,575L307,578L303,579L301,580L302,583L305,584L304,584L299,584L288,584L286,583L286,581L283,581L281,580L281,577L284,576L286,574L285,573L287,571L289,567L288,565L290,565L290,564L288,563L289,562L287,561L286,557L288,557L287,553L288,550L289,547L292,546L290,542L290,539L293,537L293,534L296,531L295,528L294,527L292,521L295,517L294,514L295,510L298,507L301,504L300,503L301,501L300,495L305,493L306,489L306,488L309,484L315,484L317,487L319,484L324,484L324,484L333,490L336,491L342,493L346,494L347,496L343,502L348,503L353,503L356,502L360,499L360,495L362,494L365,496L365,499L361,502L359,504L354,508Z",
    UY: "M349,513L351,513L356,515L358,515L363,517L366,518L369,520L367,522L369,524L367,526L362,529L359,528L356,529L352,528L349,528L346,527L346,524L347,524L347,520L348,516Z"
};

const MAP_COORDS = {
    CA: { x: 195, y: 122 },
    US: { x: 191, y: 194 },
    MX: { x: 173, y: 267 },
    GT: { x: 213, y: 310 },
    SV: { x: 218, y: 320 },
    HN: { x: 226, y: 315 },
    NI: { x: 232, y: 325 },
    CR: { x: 235, y: 339 },
    PA: { x: 250, y: 347 },
    CU: { x: 254, y: 282 },
    JM: { x: 260, y: 299 },
    HT: { x: 276, y: 295 },
    DO: { x: 284, y: 295 },
    TT: { x: 319, y: 335 },
    CO: { x: 277, y: 369 },
    VE: { x: 302, y: 352 },
    EC: { x: 256, y: 395 },
    PE: { x: 273, y: 430 },
    BR: { x: 360, y: 430 },
    BO: { x: 315, y: 462 },
    PY: { x: 343, y: 487 },
    CL: { x: 288, y: 534 },
    AR: { x: 317, y: 529 },
    UY: { x: 357, y: 522 }
};

// Países vecinos no incluidos en REGIA: se dibujan en gris como contexto geográfico (no interactivos)
const MAP_BACKDROP = "M254,256L255,256L257,256L257,257L254,258ZM258,255L260,257L260,260L259,260L259,257L258,255ZM256,264L257,264L259,268L259,271L258,271L257,268L256,267Z M218,300L218,299L218,299L219,300L220,297L221,297L221,297L221,297L221,299L221,301L221,302L220,303L221,304L220,306L219,308L219,308L218,310L217,310L217,304Z M341,375L340,375L338,375L337,376L335,377L334,378L333,379L331,379L329,376L328,374L327,372L327,368L328,366L327,364L326,363L326,361L325,360L323,360L321,357L321,355L321,353L323,352L324,351L323,349L323,348L326,345L328,346L331,349L331,352L333,352L335,354L337,355L336,360L334,361L335,362L334,365L336,368L337,368L338,371Z M348,372L346,371L344,372L343,372L342,373L343,374L343,375L341,375L338,371L337,368L336,368L334,365L335,362L334,361L336,360L337,355L341,356L342,355L345,354L349,355L347,360L348,363L350,366L349,368L349,370Z M299,296L301,296L301,297L300,298L298,298L296,299L295,297L296,296Z";

const COUNTRIES_LIST = [
    { id: 'AR', name: 'Argentina', flagCode: 'ar', region: 'South America' },
    { id: 'BO', name: 'Bolivia', flagCode: 'bo', region: 'South America' },
    { id: 'BR', name: 'Brasil', flagCode: 'br', region: 'South America' },
    { id: 'CA', name: 'Canadá', flagCode: 'ca', region: 'North America' },
    { id: 'CL', name: 'Chile', flagCode: 'cl', region: 'South America' },
    { id: 'CO', name: 'Colombia', flagCode: 'co', region: 'South America' },
    { id: 'CR', name: 'Costa Rica', flagCode: 'cr', region: 'Central America' },
    { id: 'CU', name: 'Cuba', flagCode: 'cu', region: 'Caribbean' },
    { id: 'EC', name: 'Ecuador', flagCode: 'ec', region: 'South America' },
    { id: 'SV', name: 'El Salvador', flagCode: 'sv', region: 'Central America' },
    { id: 'US', name: 'Estados Unidos', flagCode: 'us', region: 'North America' },
    { id: 'GT', name: 'Guatemala', flagCode: 'gt', region: 'Central America' },
    { id: 'HT', name: 'Haití', flagCode: 'ht', region: 'Caribbean' },
    { id: 'HN', name: 'Honduras', flagCode: 'hn', region: 'Central America' },
    { id: 'JM', name: 'Jamaica', flagCode: 'jm', region: 'Caribbean' },
    { id: 'MX', name: 'México', flagCode: 'mx', region: 'North America' },
    { id: 'NI', name: 'Nicaragua', flagCode: 'ni', region: 'Central America' },
    { id: 'PA', name: 'Panamá', flagCode: 'pa', region: 'Central America' },
    { id: 'PY', name: 'Paraguay', flagCode: 'py', region: 'South America' },
    { id: 'PE', name: 'Perú', flagCode: 'pe', region: 'South America' },
    { id: 'DO', name: 'República Dominicana', flagCode: 'do', region: 'Caribbean' },
    { id: 'TT', name: 'Trinidad y Tobago', flagCode: 'tt', region: 'Caribbean' },
    { id: 'UY', name: 'Uruguay', flagCode: 'uy', region: 'South America' },
    { id: 'VE', name: 'Venezuela', flagCode: 've', region: 'South America' },
];

const CATEGORIES = [
    { id: 1, name: 'Autoridades y marco general', icon: 'scale' },
    { id: 2, name: 'Rol y obligaciones del patrocinador', icon: 'briefcase' },
    { id: 3, name: 'Autorización inicial del ensayo clínico', icon: 'file-check' },
    { id: 4, name: 'Gestión del producto en investigación (PI)', icon: 'flask-conical' },
    { id: 5, name: 'Conducción y cierre del ensayo', icon: 'activity' },
    { id: 6, name: 'Regulaciones específicas adicionales', icon: 'scroll' },
    { id: 7, name: 'Recursos prácticos (formularios, guías y normativas)', icon: 'link' }
];

const QUESTIONS = {
    '1.1': '¿Cuál es la Autoridad Regulatoria Nacional (ARN) para ensayos clínicos?',
    '1.2': '¿Cuáles son las normativas principales que rigen la investigación en salud?',
    '1.3': '¿Cuáles son las normativas principales que rigen la autorización de ensayos clínicos?',
    '1.4': '¿Se requiere la aprobación de un Comité de Ética de la Investigación (CEI)?',
    '1.5': '¿La aprobación de un Comité de Ética de la Investigación (CEI) debe ser previa a la presentación frente a la Autoridad Regulatoria Nacional (ARN)?',
    '1.6': '¿Existe un sistema de acreditación de los Comités de Ética de la Investigación (CEI)?',
    '1.7': '¿Existe un registro público de los Comités de Ética de la Investigación (CEI)?',
    '1.8': '¿Se establece qué tipo de investigaciones deben ser autorizadas por la Autoridad Regulatoria Nacional (ARN) antes de su inicio?',
    '2.1': '¿La normativa define al patrocinador de un ensayo clínico?',
    '2.2': '¿Se requiere que el patrocinador tenga un representante legal o una entidad jurídica domiciliada en el país?',
    '2.3': '¿Se establecen los requisitos que debe cumplir el patrocinador para poder actuar como tal?',
    '2.4': '¿Se establecen los requisitos que debe cumplir el patrocinador si se actúa a través de una Organización de Investigación por Contrato (OIC / CRO)?',
    '2.5': '¿Existen requisitos específicos para la selección de centros o unidades de investigación?',
    '2.6': '¿Existen requisitos específicos para la selección de investigadores?',
    '2.7': '¿Se establecen requisitos sobre seguros y compensación para los participantes?',
    '3.1': '¿Se establece cuál es el contenido esencial del envío para la autorización inicial?',
    '3.2': '¿Se establece cómo es el proceso de envío (plataforma, formato)?',
    '3.3': '¿Se definen cuáles son los plazos regulatorios oficiales para la cronología de la revisión?',
    '3.4': '¿Se deben pagar tasas (aranceles) por la evaluación del ensayo?',
    '3.5': '¿Es obligatorio el registro público del ensayo clínico antes de su inicio?',
    '3.6': '¿Existen mecanismos de reconocimiento de evaluaciones realizadas por Autoridades Regulatorias Nacionales de otros países?',
    '3.7': '¿Cuál es el orden secuencial de pasos que deben cumplir el patrocinador, la institución y el investigador principal desde el principio del proceso hasta la autorización para el inicio del estudio?',
    '4.1': '¿Se establecen requisitos de etiquetado para el producto de investigación (PI)?',
    '4.2': '¿Se requiere prueba de Buenas Prácticas de Manufactura (BPM/GMP) para el producto de investigación (PI)?',
    '4.3': '¿La aprobación del ensayo incluye la autorización para importar/usar el producto de investigación (PI)?',
    '5.1': 'Informes de Seguridad: ¿Se establecen cuáles son los requisitos, canales, mecanismos y plazos para notificar EAS y RASI/SUSARs?',
    '5.2': '¿Se requiere la presentación de informes anuales de seguridad?',
    '5.3': '¿Se requiere la presentación de informes de seguimiento periódicos?',
    '5.4': '¿Se establece qué tipo de enmiendas al protocolo requieren aprobación previa de la Autoridad Regulatoria Nacional (ARN) y/o del Comité de Ética de la Investigación (CEI)?',
    '5.5': '¿Existen obligaciones sobre el acceso post-estudio a la intervención en investigación?',
    '6.1': '¿Existe una ley de protección de datos personales aplicable a los ensayos clínicos?',
    '6.2': '¿Existen normativas o guías específicas para ensayos clínicos con vacunas?',
    '6.3': '¿Existen normativas o guías específicas para la recolección y/o utilización de muestras para investigación?',
    '6.4': 'Ensayos clínicos para situaciones específicas: ¿Existen normativas o guías específicas para otro tipo de ensayos clínicos?'
};

const NO_BOOLEAN_QUESTIONS = ['1.1', '1.2', '1.3', '3.7'];

const RESOURCE_SUBTITLES = {
    '7.1': { title: 'Normativas clave de referencia rápida', icon: 'scroll-text' },
    '7.2': { title: 'Formularios oficiales', icon: 'file-text' },
    '7.3': { title: 'Guías, instructivos oficiales y web', icon: 'book-open' }
};

// --- ANALYTICS ---

const analytics = {
    // Helper base
    track: function (eventName, params = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    },

    // Registro de página virtual para navegación SPA
    pageView: function (path, title) {
        if (typeof gtag === 'function') {
            gtag('event', 'page_view', {
                page_path: path,
                page_title: title,
                page_location: window.location.origin + path
            });
        }
    },

    // País consultado
    countryView: function (countryName, source = 'map') {
        this.track('country_view', {
            country_name: countryName,
            source: source // 'map' | 'search' | 'detail_search'
        });
    },

    // Sección del país consultada (sidebar o scroll)
    sectionView: function (countryName, sectionCode, sectionName) {
        this.track('section_view', {
            country_name: countryName,
            section_code: sectionCode,
            section_name: sectionName
        });
    },

    // Comparador ejecutado
    compareExecuted: function (questionId, questionText) {
        this.track('compare_executed', {
            question_id: questionId,
            question_text: questionText.substring(0, 100)
        });
    },

    // Filtro ejecutado
    filterExecuted: function (criteriaList, resultsCount) {
        this.track('filter_executed', {
            criteria_count: criteriaList.length,
            criteria_list: criteriaList.join(' | ').substring(0, 200),
            results_count: resultsCount
        });
    },

    // Enlace de recurso clickeado
    resourceLinkClicked: function (countryName, linkTitle, linkSection, linkUrl) {
        this.track('resource_link_click', {
            country_name: countryName,
            link_title: linkTitle,
            link_section: linkSection, // '7.1' | '7.2' | '7.3'
            link_url: linkUrl.substring(0, 200)
        });
    },

    // PDF generado
    pdfGenerated: function (countryName) {
        this.track('pdf_generated', {
            country_name: countryName
        });
    },

    // Búsqueda usada (al seleccionar resultado)
    searchUsed: function (searchTerm, selectedCountry) {
        this.track('search_used', {
            search_term: searchTerm,
            selected_country: selectedCountry
        });
    },

    // Herramienta abierta (comparar / filtrar)
    toolOpened: function (toolName) {
        this.track('tool_opened', {
            tool_name: toolName // 'compare' | 'filter'
        });
    }
};

window.analytics = analytics;

// --- APLICACIÓN PRINCIPAL (OBJETO GLOBAL) ---

const app = {
    state: {
        view: 'home',
        selectedCountry: null,
        searchTerm: '',
        comparisonResults: null,
        filteredCountries: null,
        filterCriteria: [],
        compareMode: 'requirement',
        selectedCountriesForCompare: []
    },

    init: function () {
        window.app = this; // Asegurar referencia global inmediata
        
        // Inicializar caché local inteligente en segundo plano
        DataCacheManager.init().catch(err => console.error("DataCacheManager init failed:", err));
        
        // Detectar si está embebido en un iframe
        const isEmbed = window.self !== window.top || new URLSearchParams(window.location.search).has('embed');
        if (isEmbed) {
            document.body.classList.add('is-embedded');
            const style = document.createElement('style');
            style.textContent = `
                header, footer { display: none !important; }
                body { background-color: transparent !important; min-height: 0 !important; height: auto !important; }
                main { padding-top: 0.5rem !important; padding-bottom: 2rem !important; max-width: 100% !important; min-height: 0 !important; height: auto !important; }
            `;
            document.head.appendChild(style);

            // Observador dinámico de mutaciones DOM con debouncing para evitar bucles infinitos de titileo
            setTimeout(() => {
                const container = document.getElementById('app-container');
                if (container) {
                    let resizeTimer = null;
                    const observer = new MutationObserver(() => {
                        if (resizeTimer) clearTimeout(resizeTimer);
                        resizeTimer = setTimeout(() => {
                            this.notifyResize();
                        }, 150);
                    });
                    observer.observe(container, { childList: true, subtree: true });
                }
            }, 200);
        }

        // Cargar país y auto-imprimir si viene por parámetros de URL (workaround para sandbox)
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const countryParam = params.get('country');
        const compareModeParam = params.get('compareMode');
        const qParam = params.get('q');
        const cParam = params.get('c');
        const isPrintMode = params.get('print') === 'true';
        const referrerParam = params.get('referrer') || 'https://www.paho.org/es/regia';

        if (viewParam) {
            this.state.view = viewParam;
        } else if (countryParam) {
            this.state.selectedCountry = countryParam;
            this.state.view = 'country';
        }

        if (compareModeParam) {
            this.state.compareMode = compareModeParam;
        }

        if (cParam && compareModeParam === 'countries') {
            this.state.selectedCountriesForCompare = cParam.split(',');
        }

        try {
            this.render();
            this.setupGlobalEvents();

            // Si viene en modo impresión, inyectar el banner y disparar la impresión
            if (isPrintMode) {
                if (this.state.view === 'country' && countryParam) {
                    this.handleAutoPrint(countryParam, referrerParam);
                } else if (this.state.view === 'compare') {
                    if (compareModeParam === 'requirement' && qParam) {
                        const select = document.getElementById('compare-select');
                        if (select) {
                            select.value = qParam;
                            this.executeCompare().then(() => {
                                lucide.createIcons();
                                this.handleAutoPrint(`Comparativa por Requisito (${qParam})`, referrerParam);
                            });
                        }
                    } else if (compareModeParam === 'countries' && cParam) {
                        this.executeCompareByCountries().then(() => {
                            lucide.createIcons();
                            this.handleAutoPrint(`Comparativa de Países (${cParam.replace(/,/g, ', ')})`, referrerParam);
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Critical Init Error:", error);
            const container = document.getElementById('app-container');
            if (container) {
                container.innerHTML = `<div class="p-10 bg-red-50 text-red-600 rounded-xl border border-red-200 text-center">
                    <h2 class="font-bold text-xl mb-2">Error de Inicialización</h2>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Cargar de nuevo</button>
                </div>`;
            }
        }
    },

    // Navegación
    setView: function (viewName) {
        this.state.view = viewName;
        if (viewName !== 'country') this.state.selectedCountry = null;
        
        // Limpiar impacto si no es home
        const impactContainer = document.getElementById('impact-section');
        if (impactContainer && viewName !== 'home') {
            impactContainer.innerHTML = '';
        }

        if (viewName === 'home') {
            this.state.searchTerm = '';
            this.state.filteredCountries = null;
            analytics.pageView('/', 'REGIA - Inicio');
        } else if (viewName === 'compare') {
            analytics.pageView('/compare', 'REGIA - Comparador Normativo');
        } else if (viewName === 'filter') {
            analytics.pageView('/filter', 'REGIA - Buscador de Criterios');
        } else if (viewName === 'report') {
            analytics.pageView('/reportes', 'REGIA - Reporte Normativo');
        }
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (window.self !== window.top || new URLSearchParams(window.location.search).has('embed')) {
            try {
                window.parent.postMessage({
                    sentinel: 'ops-platform',
                    type: 'scroll-top'
                }, '*');
            } catch (e) {}
        }
    },

    goHome: function () {
        this.setView('home');
    },

    focusSearch: function () {
        this.setView('home');
        const input = document.getElementById('home-search-input');
        if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    selectCountry: function (countryName, source = 'map') {
        this.state.selectedCountry = countryName;
        analytics.countryView(countryName, source);
        analytics.pageView('/country/' + encodeURIComponent(countryName.toLowerCase()), 'REGIA - ' + countryName);
        this.setView('country');
    },

    // UTILIDAD: Linkificación inteligente (Solo para el campo Fuente)
    linkifyText: function (text, links) {
        if (!text || !links || links.length === 0) return text;

        const sortedLinks = [...links].sort((a, b) => {
            const titleA = a.titulo || '';
            const titleB = b.titulo || '';
            return titleB.length - titleA.length;
        });

        let linkedText = text;

        sortedLinks.forEach(link => {
            if (link.titulo && link.enlace) {
                const escapedTitle = link.titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedTitle, 'gi');

                linkedText = linkedText.replace(regex, (match) => {
                    return `<a href="${link.enlace}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800" title="Ver normativa oficial">${match}</a>`;
                });
            }
        });

        return linkedText;
    },

    // --- RENDERIZADORES ---

    render: function () {
        const container = document.getElementById('app-container');


        // Mostrar 'Menú Principal' en la barra superior solo si se está dentro de una sección
        const navBar = document.getElementById('main-nav-bar');
        if (navBar) {
            if (this.state.view === 'home') {
                navBar.classList.add('hidden');
            } else {
                navBar.classList.remove('hidden');
            }
        }

        switch (this.state.view) {
            case 'home':
                this.renderHome(container);
                break;
            case 'search':
                this.renderSearch(container);
                break;
            case 'country':
                this.renderCountryDetail(container);
                break;
            case 'compare':
                analytics.toolOpened('compare');
                this.renderComparisonTool(container);
                break;
            case 'filter':
                analytics.toolOpened('filter');
                this.renderFilterTool(container);
                break;
            case 'report':
                this.renderReportForm(container);
                break;
        }

        lucide.createIcons();
        this.notifyResize();
    },

    lastSentHeight: 0,
    notifyResizeTimer: null,

    notifyResize: function () {
        if (window.self !== window.top || new URLSearchParams(window.location.search).has('embed')) {
            if (this.notifyResizeTimer) clearTimeout(this.notifyResizeTimer);
            
            this.notifyResizeTimer = setTimeout(() => {
                const appElem = document.getElementById('app-container') || document.body;
                const h1 = appElem.scrollHeight || 0;
                const h2 = appElem.offsetHeight || 0;
                const h3 = document.documentElement.scrollHeight || 0;
                const h4 = document.body.scrollHeight || 0;
                const fullHeight = Math.max(h1, h2, h3, h4, 350);
                const targetHeight = Math.ceil(fullHeight) + 30;

                if (Math.abs(targetHeight - this.lastSentHeight) > 5) {
                    this.lastSentHeight = targetHeight;
                    window.parent.postMessage({
                        sentinel: 'ops-platform',
                        type: 'resize',
                        height: targetHeight
                    }, '*');
                }
            }, 100);
        }
    },

    focusHomeSearch: function () {
        if (window.innerWidth < 1024) {
            this.setView('search');
        } else {
            const input = document.getElementById('home-search-input');
            if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },

    // VISTA: HOME (MOBILE: SOLO 3 TARJETAS | DESKTOP: 2 COLUMNAS TARJETAS + MAPA)
    renderHome: function (container) {
        // Limpiar sección de impacto si existía
        const impactContainer = document.getElementById('impact-section');
        if (impactContainer) {
            impactContainer.innerHTML = '';
        }

        let mapPathsHtml = `<path d="${MAP_BACKDROP}" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.6" stroke-linejoin="round" pointer-events="none"></path>`;
        const SMALL_HIT = ['SV','JM','TT','CR','HT','DO','PA','GT','HN','NI','CU','UY'];
        for (const [id, pathData] of Object.entries(MAP_PATHS)) {
            const country = COUNTRIES_LIST.find(c => c.id === id);
            const coords = MAP_COORDS[id];
            if (country && coords) {
                mapPathsHtml += `
                <g class="group cursor-pointer" onmouseenter="this.parentNode.appendChild(this)" onclick="app.selectCountry('${country.name}')">
                    <path d="${pathData}" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8" stroke-linejoin="round" class="map-path hover:fill-blue-500 hover:stroke-blue-700"></path>
                    ${SMALL_HIT.includes(id) ? `<path d="${pathData}" fill="none" stroke="transparent" stroke-width="9"></path>` : ''}
                    <g class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <rect x="${coords.x - (country.name.length * 3.5)}" y="${coords.y - 20}" width="${country.name.length * 7 + 10}" height="20" rx="4" fill="rgba(15, 23, 42, 0.9)"></rect>
                        <text x="${coords.x}" y="${coords.y - 6}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${country.name}</text>
                    </g>
                </g>`;
            }
        }

        container.innerHTML = `
        <div class="max-w-7xl mx-auto py-2 animate-in fade-in duration-500">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                <!-- COLUMNA IZQUIERDA: 3 TARJETAS EN VERTICAL -->
                <div class="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <!-- Card 1: Búsqueda por País -->
                    <button onclick="app.focusHomeSearch()" class="w-full text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 cursor-pointer flex flex-col justify-between flex-1 group">
                        <div>
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform">
                                <i data-lucide="map" class="w-6 h-6 text-white"></i>
                            </div>
                            <h3 class="font-extrabold text-slate-800 text-lg tracking-tight mb-2">Búsqueda por país</h3>
                            <p class="text-xs text-slate-500 leading-relaxed mb-3">Seleccione un país en el mapa o use el buscador para acceder a su perfil regulatorio.</p>
                        </div>
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-blue-700 bg-blue-50 w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
                            <span>Ir a búsqueda por país</span>
                        </div>
                    </button>

                    <!-- Card 2: Comparador -->
                    <button onclick="app.setView('compare')" class="w-full text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-teal-400 transition-all duration-300 cursor-pointer flex flex-col justify-between flex-1 group">
                        <div>
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mb-4 shadow-lg shadow-teal-200/50 group-hover:scale-110 transition-transform">
                                <i data-lucide="scale" class="w-6 h-6 text-white"></i>
                            </div>
                            <h3 class="font-extrabold text-slate-800 text-lg tracking-tight mb-2">Comparador</h3>
                            <p class="text-xs text-slate-500 leading-relaxed mb-3">Vea la normativa por pregunta o requisito en los países que seleccione.</p>
                        </div>
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-teal-700 bg-teal-50 w-fit group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <span>Ir al comparador &rarr;</span>
                        </div>
                    </button>

                    <!-- Card 3: Filtro Avanzado -->
                    <button onclick="app.setView('filter')" class="w-full text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-violet-400 transition-all duration-300 cursor-pointer flex flex-col justify-between flex-1 group">
                        <div>
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mb-4 shadow-lg shadow-violet-200/50 group-hover:scale-110 transition-transform">
                                <i data-lucide="filter" class="w-6 h-6 text-white"></i>
                            </div>
                            <h3 class="font-extrabold text-slate-800 text-lg tracking-tight mb-2">Filtro avanzado</h3>
                            <p class="text-xs text-slate-500 leading-relaxed mb-3">Identifique los países según preguntas o requisitos específicos.</p>
                        </div>
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-violet-700 bg-violet-50 w-fit group-hover:bg-violet-600 group-hover:text-white transition-colors">
                            <span>Ir a filtrar &rarr;</span>
                        </div>
                    </button>
                </div>

                <!-- COLUMNA DERECHA: MAPA INTERACTIVO Y BUSCADOR (OCULTO EN CELULARES) -->
                <div class="hidden lg:flex lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex-col justify-between">
                    <div>
                        <!-- Buscador Superior -->
                        <div class="mb-4">
                            <div class="relative group z-20 max-w-lg mx-auto">
                                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
                                </div>
                                <input 
                                    type="text" 
                                    id="home-search-input"
                                    class="block w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-full bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm text-sm"
                                    placeholder="Buscar país (ej. Argentina, México)..."
                                    value="${this.state.searchTerm}"
                                    autocomplete="off"
                                >
                                <div id="search-results-dropdown" class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 hidden">
                                </div>
                            </div>
                        </div>

                        <!-- Contenedor del Mapa -->
                        <div class="relative w-full h-[560px] bg-blue-50/40 rounded-2xl border border-blue-100 shadow-inner overflow-hidden flex items-center justify-center p-3">
                            <svg viewBox="0 0 440 640" class="w-full h-full drop-shadow-md">
                                ${mapPathsHtml}
                            </svg>
                        </div>
                    </div>
                    <p class="text-[10px] text-slate-400 text-center mt-3 leading-tight italic">
                        * Seleccione un país en el mapa o use el buscador para ingresar a su perfil regulatorio.
                    </p>
                </div>

            </div>

            <!-- LEYENDA REPORTAR ERROR O SUGERENCIA -->
            <div class="mt-8 pt-4 border-t border-slate-200/60 text-center">
                <p class="text-xs text-slate-500 font-medium flex items-center justify-center gap-1 flex-wrap">
                    <span>Por reportes de actualizaciones normativas, puede contactarnos a través del siguiente</span>
                    <button onclick="app.setView('report')" class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer transition-colors inline-flex items-center gap-1">
                        <span>formulario</span>
                        <i data-lucide="message-square-plus" class="w-3.5 h-3.5"></i>
                    </button>
                </p>
            </div>
        </div>`;

        const input = document.getElementById('home-search-input');
        if (input) {
            input.addEventListener('input', (e) => {
                this.state.searchTerm = e.target.value;
                this.updateSearchResults();
            });
        }
        
        this.updateSearchResults();
    },

    // VISTA: BÚSQUEDA POR PAÍS
    renderSearch: function (container) {
        const countryItems = COUNTRIES_LIST.map(c => `
            <button onclick="app.selectCountry('${c.name}', 'search')" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between group text-left">
                <div class="flex items-center gap-3">
                    <span class="fi fi-${c.flagCode} text-2xl rounded shadow-xs"></span>
                    <span class="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">${c.name}</span>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
            </button>
        `).join('');

        container.innerHTML = `
        <div class="max-w-3xl mx-auto py-4 animate-in fade-in duration-300">
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">Búsqueda por país</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Seleccione un país de la lista o escriba para filtrar.</p>
                    </div>
                </div>

                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
                    </div>
                    <input 
                        type="text" 
                        id="mobile-search-input"
                        oninput="app.updateMobileSearchResults(this.value)"
                        class="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-medium"
                        placeholder="Escriba el nombre del país (ej. Argentina, México)..."
                        autocomplete="off"
                    >
                </div>
            </div>

            <div id="mobile-country-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${countryItems}
            </div>
        </div>`;

        lucide.createIcons();

        setTimeout(() => {
            const input = document.getElementById('mobile-search-input');
            if (input && window.innerWidth < 1024) {
                input.focus();
            }
        }, 150);
    },

    updateMobileSearchResults: function (term) {
        const grid = document.getElementById('mobile-country-grid');
        if (!grid) return;
        const cleanTerm = (term || '').toLowerCase().trim();

        const filtered = COUNTRIES_LIST.filter(c => c.name.toLowerCase().includes(cleanTerm));

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">No se encontraron países que coincidan con "${term}".</div>`;
            return;
        }

        grid.innerHTML = filtered.map(c => `
            <button onclick="app.selectCountry('${c.name}', 'search')" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between group text-left">
                <div class="flex items-center gap-3">
                    <span class="fi fi-${c.flagCode} text-2xl rounded shadow-xs"></span>
                    <span class="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">${c.name}</span>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
            </button>
        `).join('');
        lucide.createIcons();
    },

    updateSearchResults: function () {
        let dropdown = document.getElementById('search-results-dropdown');
        if (!dropdown) {
            dropdown = document.getElementById('detail-search-results-dropdown');
        }
        if (!dropdown) return;

        const term = this.state.searchTerm.toLowerCase();

        if (!term) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }

        const results = COUNTRIES_LIST.filter(c => c.name.toLowerCase().includes(term));
        dropdown.classList.remove('hidden');

        if (results.length > 0) {
            const searchSource = document.getElementById('detail-search-input') ? 'detail_search' : 'search';
            dropdown.innerHTML = results.map(c => `
                <button onclick="analytics.searchUsed(app.state.searchTerm, '${c.name}'); app.selectCountry('${c.name}', '${searchSource}')" class="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0">
                    <span class="fi fi-${c.flagCode} shadow-sm rounded-sm"></span>
                    <span class="font-medium text-slate-700">${c.name}</span>
                </button>
            `).join('');
        } else {
            dropdown.innerHTML = '<div class="p-4 text-slate-400 text-sm text-center">No se encontraron resultados</div>';
        }
    },

    // VISTA: DETALLE PAÍS
    renderCountryDetail: async function (container) {
        const countryName = this.state.selectedCountry;

        container.innerHTML = `
            <div class="flex justify-center items-center h-96">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>`;

        try {
            // CONSULTA PRIORITARIA A DataCacheManager (0 PETICIONES A SUPABASE SI ESTÁ EN CACHÉ)
            let faq = null, summary = null, links = [];
            const cachedDetail = DataCacheManager.getCountryDetail(countryName);

            if (cachedDetail && cachedDetail.faq && cachedDetail.summary) {
                faq = cachedDetail.faq;
                summary = cachedDetail.summary;
                links = cachedDetail.links;
            } else {
                const [faqRes, summaryRes, linksRes] = await Promise.all([
                    supabase.from('faq_rows_corregido').select('*').eq('pais', countryName).limit(1).single(),
                    supabase.from('resumen_ejecutivo').select('*').eq('pais', countryName).single(),
                    supabase.from('enlaces').select('*').eq('pais', countryName).order('question_code')
                ]);
                faq = faqRes.data;
                summary = summaryRes.data;
                links = linksRes.data || [];
            }

            if (!faq || !summary) {
                container.innerHTML = '<div class="text-center p-10 text-red-500">Datos no disponibles para este país.</div>';
                return;
            }

            const countryData = COUNTRIES_LIST.find(c => c.name === countryName);
            const flagCode = countryData ? countryData.flagCode : 'xx';

            // Generar HTML de Preguntas
            let questionsHtml = '';
            CATEGORIES.forEach(cat => {
                questionsHtml += `
                <div id="cat-${cat.id}" class="scroll-mt-24 mb-12">
                    <h3 class="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3 pb-2 border-b border-slate-200">
                        <i data-lucide="${cat.id === 7 ? 'link' : 'file-check'}" class="w-6 h-6 text-blue-600"></i>
                        ${cat.name}
                    </h3>`;

                if (cat.id === 7) {
                    // SECCIÓN 7: RECURSOS
                    if (links.length === 0) {
                        questionsHtml += `<div class="text-slate-500 italic p-4 bg-slate-50 rounded-lg">No hay recursos disponibles.</div>`;
                    } else {
                        questionsHtml += `<div class="space-y-8">`;
                        let addedAny = false;
                        ['7.1', '7.2', '7.3'].forEach(subCode => {
                            const subLinks = links.filter(l => {
                                const codeStr = String(l.question_code).trim();
                                return codeStr === subCode || codeStr === subCode.replace('.0', '');
                            });
                            
                            if (subCode === '7.1') {
                                subLinks.sort((a, b) => (Number(b.peso) || 0) - (Number(a.peso) || 0));
                            }

                            const htmlId = `question-${subCode.replace(/\./g, '-')}`;

                            if (subLinks.length > 0) {
                                addedAny = true;
                                const info = RESOURCE_SUBTITLES[subCode];
                                questionsHtml += `
                                <div id="${htmlId}" class="scroll-mt-28">
                                    <h4 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <i data-lucide="${info.icon}" class="w-5 h-5 text-teal-600"></i>
                                        ${info.title}
                                    </h4>
                                    <div class="grid grid-cols-1 gap-4">
                                        ${subLinks.map(link => `
                                            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                                <h5 class="font-bold text-blue-700 mb-2">${link.titulo}</h5>
                                                <p class="text-sm text-slate-600 mb-4">${link.proposito_descripcion || link.descripcion || ''}</p>
                                                <a href="${link.enlace}" target="_blank" rel="noopener noreferrer" onclick="analytics.resourceLinkClicked('${countryName}', '${link.titulo.replace(/'/g, '\\&apos;')}', '${subCode}', '${link.enlace}')" class="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                                                    Acceder al recurso <i data-lucide="external-link" class="w-3 h-3"></i>
                                                </a>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>`;
                            }
                        });

                        if (!addedAny) {
                            questionsHtml += `
                            <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                                <p class="text-slate-500 italic mb-4">No se encontraron recursos categorizados como 7.1, 7.2 o 7.3 para este país.</p>
                                <div class="grid grid-cols-1 gap-3 text-left">
                                    ${links.map(link => `
                                        <div class="p-3 bg-white rounded border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <span class="text-[10px] font-mono bg-slate-100 px-1 rounded mr-2">${link.question_code}</span>
                                                <span class="text-sm font-medium">${link.titulo}</span>
                                            </div>
                                            <a href="${link.enlace}" target="_blank" class="text-blue-600"><i data-lucide="external-link" class="w-4 h-4"></i></a>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>`;
                        }
                        questionsHtml += `</div>`;
                    }
                } else {
                    // SECCIONES PREGUNTAS
                    questionsHtml += `<div class="space-y-6">`;
                    Object.entries(QUESTIONS)
                        .filter(([key]) => key.startsWith(`${cat.id}.`))
                        .map(([qId, qText]) => {
                            const dbKey = `q_${qId.replace(/\./g, '_')}`;
                            const htmlId = `question-${qId.replace(/\./g, '-')}`;

                            // TEXTOS ORIGINALES (Sin procesar para Directa y Ampliada)
                            const directAnswer = faq[`${dbKey}_directa`];
                            const extendedAnswer = faq[`${dbKey}_ampliada`];

                            // PROCESAMIENTO SOLO PARA LA FUENTE
                            const rawSource = faq[`${dbKey}_fuente`];
                            const cleanSource = rawSource ? this.linkifyText(rawSource, links) : '';

                            questionsHtml += `
                            <div id="${htmlId}" class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 scroll-mt-28">
                                <h4 class="font-bold text-slate-800 text-lg mb-4">${qId} - ${qText}</h4>
                                <div class="mb-4 text-sm text-slate-800 font-medium bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-500">
                                    ${directAnswer || "Información no disponible"}
                                </div>
                                ${extendedAnswer ? `<div class="mb-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">${extendedAnswer}</div>` : ''}
                                ${cleanSource ? `
                                    <div class="mt-4 pt-4 border-t border-slate-100">
                                        <button onclick="app.toggleSource('source-${qId.replace(/\./g, '-')}')" class="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors no-print">
                                            <i data-lucide="book-open" class="w-3 h-3"></i> Ver fuente
                                        </button>
                                        <div id="source-${qId.replace(/\./g, '-')}" class="hidden print-visible mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500 font-mono whitespace-pre-wrap animate-in fade-in duration-200"><span class="font-bold mb-1 text-slate-700 hidden print:inline">Fuente:</span> ${cleanSource}</div>
                                    </div>` : ''}
                            </div>`;
                        });
                    questionsHtml += `</div>`;
                }
                questionsHtml += `</div>`;
            });

            // Layout
            container.innerHTML = `
            <div class="animate-in slide-in-from-bottom-4 duration-500 pb-20 relative">
                <!-- CABECERA EXCLUSIVA PARA IMPRESIÓN -->
                <div class="hidden print:block mb-10 text-center border-b-2 border-slate-300 pb-8">
                    <div class="flex justify-center mb-6">
                        <img src="logos-header.png" alt="OPS | OMS | Programa Regional de Bioética" class="h-14 sm:h-16 w-auto object-contain">
                    </div>
                    <div class="flex justify-center items-center gap-6 mb-4">
                        <span class="fi fi-${flagCode} text-5xl shadow-md rounded-sm" style="width: 1.5em; height: 1.125em;"></span>
                        <h1 class="text-4xl font-black text-slate-900 uppercase tracking-tight">${countryName}</h1>
                    </div>
                    <p class="text-slate-600 font-bold text-lg">Informe automatizado - Marco general</p>
                    <p class="text-sm text-slate-400 mt-2 italic">REGIA — Regulaciones para la Investigación en las Américas (OPS/OMS)</p>
                    <div class="mt-4 text-xs text-slate-400">Fecha de generación: ${new Date().toLocaleDateString()}</div>
                </div>

                <div class="mb-8 no-print">
                    <!-- Buscador en el tope -->
                    <div class="mb-6 max-w-md mx-auto relative group z-20">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
                        </div>
                        <input 
                            type="text" 
                            id="detail-search-input"
                            class="block w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-full bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-sm"
                            placeholder="Buscar otro país..."
                            value=""
                            autocomplete="off"
                        >
                        <div id="detail-search-results-dropdown" class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 hidden">
                        </div>
                    </div>


                    
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
                        <div class="flex items-center gap-4">
                            <span class="fi fi-${flagCode} text-5xl rounded shadow-sm"></span>
                            <h2 class="text-4xl font-bold text-slate-900">${summary.pais}</h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="app.scrollToSection(7)" class="bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-100 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                Ver recursos
                            </button>
                            <button onclick="app.printReport('${summary.pais}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all">
                                <i data-lucide="printer" class="w-4 h-4"></i> Generar informe PDF
                            </button>
                        </div>
                    </div>

                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <!-- Sidebar Navigation -->
                    <div class="lg:col-span-1 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar pr-2">
                         <div class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                            <h3 class="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <i data-lucide="info" class="w-5 h-5"></i> Información general
                            </h3>
                            <div class="space-y-4 text-sm">
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide">Autoridad</strong><span class="text-slate-800 font-medium">${summary.autoridad_regulatoria}</span></div>
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide">Sitio web</strong><a href="${summary.sitio_web_oficial}" target="_blank" class="text-blue-600 hover:underline break-words">${summary.sitio_web_oficial}</a></div>
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Contacto</strong><div class="flex items-start gap-2 text-slate-700 mb-1"><i data-lucide="mail" class="w-3 h-3 mt-1 text-slate-400"></i><span class="break-all">${summary.correo_contacto}</span></div></div>
                                <div><strong class="block text-slate-500 text-xs uppercase tracking-wide">Domicilio</strong><div class="flex items-start gap-2 text-slate-700"><i data-lucide="map-pin" class="w-3 h-3 mt-1 text-slate-400"></i><span>${summary.domicilio}</span></div></div>
                                ${summary.fecha_compilacion ? `
                                <div class="pt-3 mt-1 border-t border-blue-100">
                                    <strong class="block text-slate-500 text-xs uppercase tracking-wide mb-1">Última actualización</strong>
                                    <div class="flex items-center gap-2 text-slate-700">
                                        <i data-lucide="calendar-check" class="w-3 h-3 text-teal-500"></i>
                                        <span class="font-semibold text-teal-700">${summary.fecha_compilacion}</span>
                                    </div>
                                </div>` : ''}
                            </div>
                        </div>

                        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-2 no-print">
                            <h3 class="font-bold text-slate-800 px-4 py-3 text-sm border-b border-slate-50 mb-2">Navegación</h3>
                            ${CATEGORIES.map(cat => {
                let catQuestions = (cat.id === 7) ? Object.entries(RESOURCE_SUBTITLES).map(([k, v]) => [k, v.title]) : Object.entries(QUESTIONS).filter(([k]) => k.startsWith(`${cat.id}.`));
                const navId = `nav-cat-${cat.id}`;
                return `
                                <div class="nav-section bg-white rounded-lg border border-slate-100 overflow-hidden mb-2" id="${navId}-wrapper">
                                    <button
                                        onclick="app.toggleNavSection('${navId}', ${cat.id})"
                                        class="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700 select-none"
                                        aria-expanded="false"
                                        id="${navId}-btn"
                                    >
                                        <span class="flex items-center gap-2">
                                            <i data-lucide="${cat.id === 7 ? 'link' : (cat.icon || 'file-check')}" class="w-4 h-4 text-blue-500"></i>
                                            ${cat.name}
                                        </span>
                                        <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-200" id="${navId}-chevron"></i>
                                    </button>
                                    <div class="bg-slate-50 border-t border-slate-100 hidden" id="${navId}-panel">
                                        <button onclick="app.scrollToSection(${cat.id})" class="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:underline border-b border-slate-100">Ir al inicio de sección</button>
                                        ${catQuestions.map(([qId, qText]) => `
                                            <button onclick="app.handleQuestionClick('${countryName}', '${qId}', this)" class="w-full text-left px-6 py-3 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0 leading-normal pl-8">
                                                <span class="font-bold mr-1 text-blue-500">${qId}</span> ${qText}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>`;
            }).join('')}
                        </div>
                    </div>

                    <div class="lg:col-span-3 space-y-12">
                        ${questionsHtml}
                    </div>
                </div>
                <button id="scroll-top-btn" onclick="app.scrollToTop()" title="Volver al inicio" class="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 hover:scale-110 opacity-0 translate-y-10 pointer-events-none" style="transition: opacity 0.3s ease, transform 0.3s ease;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>
                    </svg>
                </button>
                <style>#scroll-top-btn{touch-action:manipulation;}</style>
            </div>`;

            const input = document.getElementById('detail-search-input');
            if (input) {
                input.addEventListener('input', (e) => {
                    this.state.searchTerm = e.target.value;
                    this.updateSearchResults();
                });
            }
            this.notifyResize();
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="text-red-500 text-center">Error cargando datos: ${error.message}</div>`;
        }
    },

    // VISTA: COMPARADOR
    renderComparisonTool: function (container) {
        const mode = this.state.compareMode;
        const selected = this.state.selectedCountriesForCompare;

        const countryPickerHtml = COUNTRIES_LIST.map(c => {
            const isSelected = selected.includes(c.name);
            return `<button onclick="app.selectCompareCountry('${c.name}')" class="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-md scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700'
            }">
                <span class="fi fi-${c.flagCode} rounded-sm shadow-sm"></span>
                ${c.name}
                ${isSelected ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            </button>`;
        }).join('');

        container.innerHTML = `
        <div class="animate-in fade-in pb-20">
            <h2 class="text-3xl font-bold text-slate-800 mb-2 text-center no-print">Comparador</h2>
            <p class="text-slate-500 mb-6 text-center text-sm no-print">Vea la normativa por pregunta o requisito en los países que seleccione.</p>

            <!-- TABS -->
            <div class="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mx-auto mb-8 no-print">
                <button onclick="app.setCompareMode('requirement')" class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    mode === 'requirement' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }">
                    Por requisito
                </button>
                <button onclick="app.setCompareMode('countries')" class="px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    mode === 'countries' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }">
                    Por país
                </button>
            </div>

            <!-- PANEL: POR REQUISITO -->
            <div id="panel-requirement" class="${mode === 'requirement' ? '' : 'hidden'}">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 max-w-3xl mx-auto no-print">
                    <label class="block text-sm font-bold text-slate-700 mb-3 text-center">Requisito a comparar</label>
                    <div class="flex gap-4 flex-col sm:flex-row">
                        <div class="relative flex-1">
                            <select id="compare-select" class="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 pr-8">
                                <option value="">Selecciona una pregunta...</option>
                                ${CATEGORIES.filter(c => c.id !== 7).map(cat => `
                                    <optgroup label="${cat.name}">
                                        ${Object.entries(QUESTIONS)
                                            .filter(([k]) => k.startsWith(`${cat.id}.`))
                                            .map(([k, v]) => `<option value="${k}">${k} - ${v}</option>`)
                                            .join('')}
                                    </optgroup>
                                `).join('')}
                            </select>
                            <div class="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                        </div>
                        <button onclick="app.executeCompare()" id="compare-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            Comparar
                        </button>
                    </div>
                </div>
                <div id="compare-requirement-print-header" class="print-only mb-6 border-b-2 border-slate-900 pb-4 hidden">
                    <h1 class="text-2xl font-black text-slate-900 uppercase">Informe comparativo por requisito</h1>
                    <p id="compare-requirement-print-title" class="text-base font-bold text-blue-800 mt-1"></p>
                    <div class="text-xs text-slate-500 mt-2">REGIA — Regulaciones para la Investigación en las Américas (OPS/OMS) | Fecha de generación: ${new Date().toLocaleDateString()}</div>
                </div>
                <div id="compare-selected-question" class="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl hidden animate-in fade-in flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Requisito comparado</span>
                        <h3 id="compare-question-title" class="text-xl font-bold text-slate-800 mt-1"></h3>
                    </div>
                    <button onclick="app.printComparison('requirement')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all no-print shrink-0 cursor-pointer">
                        <i data-lucide="printer" class="w-4 h-4"></i> Generar informe PDF
                    </button>
                </div>
                <div id="compare-results" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </div>

            <!-- PANEL: POR PAÍS -->
            <div id="panel-countries" class="${mode === 'countries' ? '' : 'hidden'}">
                <!-- AVISO DE RESTRICCIÓN PARA DISPOSITIVOS MÓVILES (< 768px) -->
                <div class="block md:hidden bg-blue-50/90 border border-blue-200 rounded-2xl p-6 text-center max-w-md mx-auto my-4 shadow-sm animate-in fade-in no-print">
                    <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <i data-lucide="monitor" class="w-6 h-6"></i>
                    </div>
                    <h4 class="font-bold text-slate-800 text-base mb-1.5">Funcionalidad para tablets y computadoras (PC)</h4>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4">
                        La comparación en paralelo de varios países requiere mayor ancho de pantalla para visualizar las columnas de forma legible. Esta modalidad está disponible exclusivamente en <strong>Tablets</strong> y <strong>Computadoras de Escritorio</strong>.
                    </p>
                    <div class="bg-white p-3 rounded-xl border border-blue-100 text-xs text-blue-800 font-medium flex items-center justify-center gap-2 shadow-xs">
                        <span>💡 En su celular, le recomendamos utilizar la pestaña <strong>"Por requisito"</strong>.</span>
                    </div>
                </div>

                <!-- PANEL DE SELECCIÓN DE PAÍSES (SOLO EN PANTALLA) -->
                <div class="hidden md:block no-print bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 max-w-4xl mx-auto">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700">Seleccionar países a comparar</label>
                            <p class="text-xs text-slate-400 mt-0.5">Mínimo 2, máximo 3 países</p>
                        </div>
                        ${selected.length > 0 ? `<span class="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">${selected.length} seleccionado${selected.length > 1 ? 's' : ''}</span>` : ''}
                    </div>
                    <div class="flex flex-wrap gap-2 mb-6 justify-center">${countryPickerHtml}</div>
                    <div class="flex justify-center">
                        <button onclick="app.executeCompareByCountries()" id="compare-countries-btn"
                            class="bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            ${selected.length < 2 ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            Comparar países
                        </button>
                    </div>
                </div>

                <!-- CONTENEDOR DE RESULTADOS COMPARATIVOS (IMPRIMIBLE) -->
                <div id="compare-countries-results"></div>
            </div>
        </div>`;
    },

    setCompareMode: function (mode) {
        this.state.compareMode = mode;
        this.state.selectedCountriesForCompare = [];
        const container = document.getElementById('app-container');
        this.renderComparisonTool(container);
        lucide.createIcons();
    },

    selectCompareCountry: function (name) {
        const idx = this.state.selectedCountriesForCompare.indexOf(name);
        if (idx > -1) {
            this.state.selectedCountriesForCompare.splice(idx, 1);
        } else {
            if (this.state.selectedCountriesForCompare.length >= 3) return;
            this.state.selectedCountriesForCompare.push(name);
        }
        const container = document.getElementById('app-container');
        this.renderComparisonTool(container);
        lucide.createIcons();
    },

    executeCompareByCountries: async function () {
        const selected = this.state.selectedCountriesForCompare;
        if (selected.length < 2) return;

        const btn = document.getElementById('compare-countries-btn');
        const resultsContainer = document.getElementById('compare-countries-results');
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Cargando...`;
        btn.disabled = true;
        resultsContainer.innerHTML = `<div class="flex justify-center py-16"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div></div>`;

        let data = DataCacheManager.getCountriesComparison(selected);

        if (!data || data.length === 0) {
            const res = await supabase
                .from('faq_rows_corregido')
                .select('*')
                .in('pais', selected);
            data = res.data || [];
        }

        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Comparar países`;
        btn.disabled = selected.length < 2;

        if (!data || data.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center text-red-500 p-8">Error al cargar datos.</div>`;
            return;
        }

        // Ordenar países seleccionados alfabéticamente (A-Z)
        const sortedSelected = [...selected].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
        const ordered = sortedSelected.map(name => data.find(r => r.pais === name)).filter(Boolean);
        const colCount = ordered.length;

        analytics.track('compare_by_countries', {
            countries: sortedSelected.join(' | '),
            count: colCount
        });

        // Construir tabla
        const flagsHeader = ordered.map(row => {
            const cd = COUNTRIES_LIST.find(c => c.name === row.pais);
            return `<th class="text-center p-4 bg-slate-100 border-b border-slate-300 min-w-[180px]">
                <div class="flex flex-col items-center gap-2">
                    <span class="fi fi-${cd?.flagCode} rounded shadow-sm" style="font-size:1.8em;"></span>
                    <span class="font-black text-black text-sm">${row.pais}</span>
                </div>
            </th>`;
        }).join('');

        let tableBody = '';
        CATEGORIES.filter(cat => cat.id !== 7).forEach(cat => {
            const questions = Object.entries(QUESTIONS).filter(([k]) => k.startsWith(`${cat.id}.`));
            // Fila de categoría
            tableBody += `<tr>
                <td colspan="${colCount + 1}" class="bg-slate-200 text-black border-t-2 border-b-2 border-slate-300 font-black text-sm px-5 py-3 uppercase tracking-wide">
                    ${cat.name}
                </td>
            </tr>`;

            questions.forEach(([qId, qText]) => {
                const dbKey = `q_${qId.replace(/\./g, '_')}`;
                const hasBoolean = !NO_BOOLEAN_QUESTIONS.includes(qId);

                const cells = ordered.map(row => {
                    const direct = row[`${dbKey}_directa`] || '<span class="text-slate-500 italic">Sin información</span>';
                    const boolVal = row[`${dbKey}_booleano`];
                    const badge = hasBoolean && boolVal !== null && boolVal !== undefined
                        ? `<span class="inline-block mb-2 px-2 py-0.5 rounded text-xs font-black ${boolVal ? 'bg-emerald-100 text-black border border-emerald-300' : 'bg-rose-100 text-black border border-rose-300'}">${boolVal ? 'SÍ' : 'NO'}</span>`
                        : '';
                    return `<td class="p-4 border-b border-slate-200 align-top text-xs text-black leading-relaxed font-normal">${badge}<div class="text-black">${direct}</div></td>`;
                }).join('');

                tableBody += `<tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="p-4 border-b border-slate-200 align-top w-56 bg-white sticky left-0 shadow-[1px_0_0_0_#e2e8f0]">
                        <span class="inline-block font-mono text-[10px] font-black text-black bg-slate-100 px-1.5 py-0.5 rounded mb-1 border border-slate-300">${qId}</span>
                        <p class="text-xs text-black font-bold leading-snug">${qText}</p>
                    </td>
                    ${cells}
                </tr>`;
            });
        });

        resultsContainer.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
                <div>
                    <h3 class="font-bold text-slate-800 text-base">Comparativa de ${colCount} países</h3>
                    <p class="text-xs text-slate-500">${sortedSelected.join(' vs ')}</p>
                </div>
                <button onclick="app.printComparison('countries')" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-700 shadow-sm transition-all cursor-pointer">
                    <i data-lucide="printer" class="w-4 h-4"></i> Generar informe PDF
                </button>
            </div>

            <div class="print-only mb-6 border-b-2 border-black pb-4">
                <h1 class="text-2xl font-black text-black uppercase">Informe comparativo por países</h1>
                <p class="text-base font-bold text-black mt-1">Países comparados: ${sortedSelected.join(', ')}</p>
                <div class="text-xs text-black mt-2">REGIA — Regulaciones para la Investigación en las Américas (OPS/OMS) | Fecha de generación: ${new Date().toLocaleDateString()}</div>
            </div>

            <div class="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th class="text-left p-4 bg-slate-100 border-b border-slate-300 sticky left-0 z-10 w-56">
                                    <span class="text-xs font-black text-black uppercase tracking-wide">Requisito</span>
                                </th>
                                ${flagsHeader}
                            </tr>
                        </thead>
                        <tbody>${tableBody}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
        lucide.createIcons();
        this.notifyResize();
    },

    executeCompare: async function () {
        const select = document.getElementById('compare-select');
        const resultsContainer = document.getElementById('compare-results');
        const btn = document.getElementById('compare-btn');
        const questionId = select.value;

        if (!questionId) return;

        btn.innerText = 'Cargando...';
        btn.disabled = true;

        const questionText = QUESTIONS[questionId];
        const titleContainer = document.getElementById('compare-selected-question');
        const titleElement = document.getElementById('compare-question-title');
        
        if (titleContainer && titleElement && questionText) {
            titleElement.textContent = `${questionId} - ${questionText}`;
            titleContainer.classList.remove('hidden');

            const printHeader = document.getElementById('compare-requirement-print-header');
            const printTitle = document.getElementById('compare-requirement-print-title');
            if (printHeader && printTitle) {
                printTitle.textContent = `${questionId} - ${questionText}`;
                printHeader.classList.remove('hidden');
            }
        }

        analytics.compareExecuted(questionId, questionText || '');

        const dbKey = `q_${questionId.replace(/\./g, '_')}`;
        const hasBoolean = !NO_BOOLEAN_QUESTIONS.includes(questionId);

        let data = DataCacheManager.getRequirementComparison(questionId);

        if (!data || data.length === 0) {
            let selectQuery = `pais, ${dbKey}_directa, ${dbKey}_ampliada`;
            if (hasBoolean) selectQuery += `, ${dbKey}_booleano`;
            const res = await supabase.from('faq_rows_corregido').select(selectQuery).order('pais');
            data = res.data || [];
        }

        // Ordenar países alfabéticamente (A-Z)
        if (data && Array.isArray(data)) {
            data.sort((a, b) => (a.pais || '').localeCompare(b.pais || '', 'es', { sensitivity: 'base' }));
        }

        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Comparar`;
        btn.disabled = false;

        if (data) {
            resultsContainer.innerHTML = data.map(item => {
                const direct = item[`${dbKey}_directa`];
                const extended = item[`${dbKey}_ampliada`];
                const booleanVal = item[`${dbKey}_booleano`];

                const countryData = COUNTRIES_LIST.find(c => c.name === item.pais);
                const flagCode = countryData ? countryData.flagCode : 'xx';

                return `
                <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col page-break break-inside-avoid">
                    <div class="flex justify-between items-start mb-4 border-b pb-3">
                        <h3 class="font-bold text-lg text-blue-800 flex items-center gap-2">
                            <span class="fi fi-${flagCode} rounded shadow-sm"></span>
                            ${item.pais}
                        </h3>
                        ${booleanVal !== undefined ? `
                            <span class="px-2 py-1 rounded text-xs font-bold ${booleanVal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                ${booleanVal ? 'SÍ' : 'NO'}
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-slate-800 font-medium text-sm mb-3 flex-grow">
                        ${direct || 'Sin información'}
                    </p>
                    ${extended ? `
                        <details class="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded cursor-pointer">
                            <summary class="font-bold text-blue-600 hover:text-blue-800 select-none">Ver detalle</summary>
                            <div class="mt-2 pt-2 border-t border-slate-200">${extended}</div>
                        </details>
                    ` : ''}
                </div>`;
            }).join('');
            lucide.createIcons();
        }
    },

    // VISTA: FILTRO
    renderFilterTool: function (container) {
        this.state.filterCriteria = [];
        let filtersHtml = '';
        CATEGORIES.filter(c => c.id !== 7).forEach(cat => {
            const boolQuestions = Object.entries(QUESTIONS).filter(([k]) => k.startsWith(`${cat.id}.`) && !NO_BOOLEAN_QUESTIONS.includes(k));
            if (boolQuestions.length > 0) {
                filtersHtml += `
                <details class="group">
                    <summary class="list-none flex justify-between items-center font-semibold text-slate-800 cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                        <span class="text-sm flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                            ${cat.name}
                        </span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform"></i>
                    </summary>
                    <div class="pl-3 mt-1 space-y-1.5 border-l-2 border-blue-100 ml-3">
                        ${boolQuestions.map(([k, v]) => `
                            <label class="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-blue-50/70 rounded-lg transition-colors">
                                <input type="checkbox" onchange="app.toggleFilter('${k}')" class="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                                <span class="text-xs text-slate-600 leading-snug font-medium">${k} - ${v}</span>
                            </label>
                        `).join('')}
                    </div>
                </details>`;
            }
        });

        container.innerHTML = `
        <div class="animate-in fade-in pb-20">
            <h2 class="text-3xl font-bold text-slate-800 mb-2">Filtro avanzado</h2>
            <p class="text-slate-500 mb-8 text-sm">Identifique los países según preguntas o requisitos específicos.</p>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- PANEL IZQUIERDO: CRITERIOS -->
                <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 h-fit max-h-[80vh] overflow-y-auto shadow-sm custom-scrollbar">
                    <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-slate-800 text-base">Criterios</h3>
                            <span id="filter-count-badge" class="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full hidden">0</span>
                        </div>
                        <button onclick="app.clearAllFilters()" id="clear-filters-btn" class="text-xs text-slate-400 hover:text-red-600 font-medium transition-colors hidden">
                            Limpiar todo
                        </button>
                    </div>
                    <div class="space-y-4">${filtersHtml}</div>
                </div>

                <!-- PANEL DERECHO: RESULTADOS -->
                <div id="filter-results-wrapper" class="lg:col-span-2 space-y-4">
                    <div id="filter-results">
                        <div class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                            <i data-lucide="filter" class="w-12 h-12 mb-4 text-slate-300"></i>
                            <p class="font-medium text-slate-600 text-base mb-1">Filtro en tiempo real</p>
                            <p class="text-xs text-slate-400 max-w-sm">Seleccione uno o más criterios de la izquierda para ver los países que coinciden automáticamente.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    toggleFilter: function (qId) {
        const idx = this.state.filterCriteria.indexOf(qId);
        if (idx > -1) this.state.filterCriteria.splice(idx, 1);
        else this.state.filterCriteria.push(qId);

        // Actualizar badges y botón de limpiar
        const countBadge = document.getElementById('filter-count-badge');
        const clearBtn = document.getElementById('clear-filters-btn');
        const count = this.state.filterCriteria.length;

        if (countBadge) {
            countBadge.textContent = `${count}`;
            countBadge.classList.toggle('hidden', count === 0);
        }
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', count === 0);
        }

        // Ejecutar búsqueda automática en tiempo real
        this.executeFilter();
    },

    clearAllFilters: function () {
        this.state.filterCriteria = [];
        const container = document.getElementById('app-container');
        this.renderFilterTool(container);
        lucide.createIcons();
    },

    executeFilter: async function () {
        const resultsContainer = document.getElementById('filter-results');
        if (!resultsContainer) return;

        if (this.state.filterCriteria.length === 0) {
            resultsContainer.innerHTML = `
                <div class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                    <i data-lucide="filter" class="w-12 h-12 mb-4 text-slate-300"></i>
                    <p class="font-medium text-slate-600 text-base mb-1">Filtro en tiempo real</p>
                    <p class="text-xs text-slate-400 max-w-sm">Seleccione uno o más criterios de la izquierda para ver los países que coinciden automáticamente.</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        // Loader mientras busca
        resultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <p class="text-sm font-medium text-slate-500">Filtrando países...</p>
            </div>`;

        let countryNames = [];
        const cachedResults = DataCacheManager.getFilteredCountries(this.state.filterCriteria);

        if (cachedResults && cachedResults.length > 0) {
            countryNames = cachedResults.map(d => (typeof d === 'string' ? d : d.pais));
        } else if (DataCacheManager.data.faq && DataCacheManager.data.faq.length > 0) {
            // Caché cargada pero ningún país cumple con todos los criterios
            countryNames = [];
        } else {
            // Fallback directo a Supabase si la caché no está cargada
            try {
                let query = supabase.from('faq_rows_corregido').select('pais').order('pais', { ascending: true });
                this.state.filterCriteria.forEach(criteria => {
                    const dbKey = `q_${criteria.replace(/\./g, '_')}_booleano`;
                    query = query.eq(dbKey, true);
                });
                const { data, error } = await query;
                if (!error && data) {
                    countryNames = data.map(d => d.pais);
                }
            } catch (err) {
                console.error("Error executing filter query fallback:", err);
            }
        }

        // Ordenar alfabéticamente (A-Z) en español
        countryNames.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

        analytics.filterExecuted(this.state.filterCriteria, countryNames.length);

        if (countryNames.length === 0) {
            resultsContainer.innerHTML = `
                <div class="p-8 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 text-center animate-in fade-in">
                    <i data-lucide="alert-circle" class="w-10 h-10 mx-auto mb-3 text-amber-500"></i>
                    <h4 class="font-bold text-lg mb-1">Sin coincidencias</h4>
                    <p class="text-xs text-amber-700 max-w-md mx-auto">No hay ningún país que cumpla simultáneamente con todos los ${this.state.filterCriteria.length} criterios seleccionados.</p>
                    <p class="text-xs text-amber-600 mt-2 italic">Pruebe desmarcar algún criterio para ampliar los resultados.</p>
                </div>`;
        } else {
            const countryCards = countryNames.map(name => {
                const cData = COUNTRIES_LIST.find(c => c.name === name);
                return `
                <div onclick="app.selectCountry('${name}', 'filter')" class="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-between">
                    <div class="flex items-center gap-3.5">
                        <span class="fi fi-${cData?.flagCode || 'xx'} text-3xl rounded shadow-sm"></span>
                        <h4 class="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-base">${name}</h4>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
                </div>`;
            }).join('');

            resultsContainer.innerHTML = `
            <div class="animate-in fade-in space-y-4">
                <div class="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        ${countryNames.length} país${countryNames.length > 1 ? 'es' : ''} encontrado${countryNames.length > 1 ? 's' : ''}
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                        ${this.state.filterCriteria.length} criterio${this.state.filterCriteria.length > 1 ? 's' : ''} activo${this.state.filterCriteria.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${countryCards}
                </div>
            </div>`;
        }
        lucide.createIcons();
        this.notifyResize();
    },

    // VISTA: FORMULARIO DE REPORTES / SUGERENCIAS IN-APP
    renderReportForm: function (container) {
        const countryOptions = COUNTRIES_LIST.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        container.innerHTML = `
        <div class="max-w-2xl mx-auto py-4 animate-in fade-in duration-500">
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div class="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                    <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <i data-lucide="message-square-plus" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Comentarios o sugerencias</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Ayúdenos a mantener la normativa de la región precisa y actualizada.</p>
                    </div>
                </div>

                <div id="report-alert" class="hidden mb-6 p-4 rounded-2xl text-xs font-medium"></div>

                <form id="internal-report-form" onsubmit="app.handleReportSubmit(event)" class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Nombre y apellido *</label>
                            <input type="text" id="report-name" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Dra. María González" required>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">Correo electrónico *</label>
                            <input type="email" id="report-email" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="ejemplo@organizacion.org" required>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">País relacionado *</label>
                        <select id="report-country" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                            <option value="">Seleccione un país...</option>
                            ${countryOptions}
                            <option value="General / América Latina">General / América Latina</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Comentario o sugerencia *</label>
                        <textarea id="report-comments" rows="4" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Describa detalladamente su comentario o sugerencia de actualización normativa..." required></textarea>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Documento adjunto (opcional - PDF máx. 5MB)</label>
                        <div class="flex items-center gap-3">
                            <label for="report-file" class="cursor-pointer inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100 shadow-xs">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                <span>Seleccionar archivo</span>
                            </label>
                            <span id="report-file-name" class="text-xs text-slate-500 truncate max-w-xs">Sin archivo seleccionado</span>
                            <input type="file" id="report-file" accept=".pdf" class="hidden" onchange="const f = this.files[0]; document.getElementById('report-file-name').textContent = f ? f.name : 'Sin archivo seleccionado';">
                        </div>
                    </div>

                    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button type="button" onclick="app.setView('home')" class="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" id="report-submit-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer">
                            <i data-lucide="send" class="w-3.5 h-3.5"></i>
                            <span>Enviar reporte</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>`;

        lucide.createIcons();
        this.notifyResize();
    },

    handleReportSubmit: async function (e) {
        e.preventDefault();
        const alertEl = document.getElementById('report-alert');
        const submitBtn = document.getElementById('report-submit-btn');

        if (!alertEl || !submitBtn) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white inline-block"></span> <span>Enviando...</span>`;

        try {
            const fileInput = document.getElementById('report-file');
            let fileUrl = null;

            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error('El archivo adjunto supera los 5MB permitidos.');
                }
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('reportes')
                    .upload(fileName, file);

                if (!uploadError && uploadData) {
                    const { data: urlData } = supabase
                        .storage
                        .from('reportes')
                        .getPublicUrl(fileName);
                    fileUrl = urlData?.publicUrl || null;
                }
            }

            const formData = {
                nombre_apellido: document.getElementById('report-name').value || null,
                correo: document.getElementById('report-email').value || null,
                pais: document.getElementById('report-country').value,
                comentarios: document.getElementById('report-comments').value || null,
                documento_adjunto_url: fileUrl
            };

            const { error: insertError } = await supabase
                .from('reportes_usuarios')
                .insert([formData]);

            if (insertError) throw insertError;

            alertEl.className = 'mb-6 p-4 rounded-2xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-start gap-2.5';
            alertEl.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i> <div><strong>¡Gracias por su colaboración!</strong> Su reporte ha sido enviado exitosamente a la coordinación de la plataforma.</div>';
            alertEl.classList.remove('hidden');

            document.getElementById('internal-report-form').reset();
            const fileNameLabel = document.getElementById('report-file-name');
            if (fileNameLabel) fileNameLabel.textContent = 'Sin archivo seleccionado';
        } catch (error) {
            console.error('Error submitting report:', error);
            alertEl.className = 'mb-6 p-4 rounded-2xl text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 flex items-start gap-2.5';
            alertEl.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i> <div><strong>Error al enviar:</strong> ${error.message || 'Intente nuevamente.'}</div>`;
            alertEl.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="send" class="w-3.5 h-3.5"></i> <span>Enviar reporte</span>`;
            lucide.createIcons();
            this.notifyResize();
        }
    },

    toggleSource: function (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.classList.toggle('hidden');
            const btn = el.previousElementSibling;
            if (btn) {
                const isHidden = el.classList.contains('hidden');
                btn.innerHTML = `<i data-lucide="book-open" class="w-3 h-3"></i> ${isHidden ? 'Ver fuente' : 'Ocultar fuente'}`;
                lucide.createIcons();
            }
        }
    },

    scrollToSection: function (catId) {
        const element = document.getElementById(`cat-${catId}`);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    },

    handleQuestionClick: function (countryName, qId, btnElement) {
        const qText = btnElement.textContent.trim().replace(/^\d+\.\d+\s+/, '');
        analytics.sectionView(countryName, qId, qText.substring(0, 80));
        this.scrollToQuestion(qId);
    },

    scrollToQuestion: function (qId) {
        const elementId = `question-${qId.replace(/\./g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) {
            const headerOffset = 90;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    },

    scrollToTop: function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    printReport: function (countryName) {
        console.log("printReport called for country:", countryName);

        const isEmbedded = (window.self !== window.top) || new URLSearchParams(window.location.search).has('embed');
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                               (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));

        // En dispositivos móviles dentro de un iframe (como en el portal de la OPS),
        // window.print() imprime la página contenedora completa (PAHO) debido a limitaciones de WebKit/Blink móvil.
        // Abrir una pestaña limpia independiente garantiza que se imprima ÚNICAMENTE el informe sin navegar
        // fuera de https://www.paho.org/es/regia en la pestaña principal del usuario.
        if (isMobileDevice && isEmbedded) {
            console.log("Mobile embedded print requested for:", countryName);
            try {
                analytics.pdfGenerated(countryName);
            } catch (ae) {}
            const currentUrl = window.location.href.split('?')[0];
            const redirectUrl = `${currentUrl}?country=${encodeURIComponent(countryName)}&print=true`;
            window.open(redirectUrl, '_blank');
            return;
        }

        const originalTitle = document.title;
        try {
            if (countryName) {
                document.title = `Informe_${countryName.replace(/[^\w\d-_]/g, '_')}`;
                console.log("Temporarily changed document title to:", document.title);
                try {
                    analytics.pdfGenerated(countryName);
                } catch (ae) {
                    console.error("Analytics tracking failed:", ae);
                }
            }
        } catch (titleError) {
            console.error("Failed to set title:", titleError);
        }

        try {
            console.log("Invoking window.print()...");
            window.print();
        } catch (printError) {
            console.error("Failed to invoke window.print():", printError);
        }

        setTimeout(() => {
            try {
                document.title = originalTitle;
                console.log("Restored document title to:", originalTitle);
            } catch (restoreError) {
                console.error("Failed to restore title:", restoreError);
            }
        }, 3000);
    },

    // Manejador de impresión de comparativas
    printComparison: function (mode) {
        console.log("printComparison called for mode:", mode);

        const isEmbedded = (window.self !== window.top) || new URLSearchParams(window.location.search).has('embed');
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                               (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));

        if (isMobileDevice && isEmbedded) {
            console.log("Mobile embedded comparison print requested for mode:", mode);
            let paramStr = '';
            if (mode === 'requirement') {
                const select = document.getElementById('compare-select');
                const qId = select ? select.value : '';
                if (!qId) return;
                paramStr = `view=compare&compareMode=requirement&q=${encodeURIComponent(qId)}`;
            } else if (mode === 'countries') {
                const selected = this.state.selectedCountriesForCompare;
                if (!selected || selected.length < 2) return;
                paramStr = `view=compare&compareMode=countries&c=${encodeURIComponent(selected.join(','))}`;
            }
            if (paramStr) {
                const currentUrl = window.location.href.split('?')[0];
                const redirectUrl = `${currentUrl}?${paramStr}&print=true`;
                window.open(redirectUrl, '_blank');
                return;
            }
        }

        // Si es comparación por países, forzar orientación horizontal (landscape) para evitar recortes
        if (mode === 'countries') {
            let landscapeStyle = document.getElementById('dynamic-print-orientation');
            if (!landscapeStyle) {
                landscapeStyle = document.createElement('style');
                landscapeStyle.id = 'dynamic-print-orientation';
                landscapeStyle.textContent = `@page { size: landscape; margin: 1cm; }`;
                document.head.appendChild(landscapeStyle);
            }
        }

        const originalTitle = document.title;
        try {
            const modeLabel = mode === 'requirement' ? 'Requisito' : 'Paises';
            document.title = `Informe_Comparativo_${modeLabel}`;
        } catch (e) {}

        try {
            console.log("Invoking window.print()...");
            window.print();
        } catch (printError) {
            console.error("Failed to invoke window.print():", printError);
        }

        setTimeout(() => {
            try {
                document.title = originalTitle;
                const landscapeStyle = document.getElementById('dynamic-print-orientation');
                if (landscapeStyle) landscapeStyle.remove();
            } catch (e) {}
        }, 3000);
    },

    handleAutoPrint: function (countryName, referrerUrl, isLandscape = false) {
        console.log("Auto-print mode triggered for:", countryName);
        
        const forceLandscape = isLandscape || (countryName && countryName.includes('Comparativa de Países'));

        // 1. Ocultar el header, nav y footer propios de la plataforma en pantalla para dejar la vista limpia
        const style = document.createElement('style');
        style.id = 'print-mode-styles';
        style.textContent = `
            header, footer, nav, #main-nav-bar { display: none !important; }
            main { padding-top: 1.5rem !important; }
            ${forceLandscape ? '@page { size: landscape; margin: 1cm; }' : ''}
        `;
        document.head.appendChild(style);
        
        // 2. Inyectar banner de retorno al tope del body (oculto al imprimir)
        if (!document.getElementById('print-mode-banner')) {
            const banner = document.createElement('div');
            banner.id = 'print-mode-banner';
            banner.className = 'no-print bg-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 sticky top-0 z-50 shadow-lg border-b border-slate-700';
            banner.innerHTML = `
                <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div class="flex items-center gap-2.5">
                        <span class="relative flex h-3 w-3 shrink-0">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span class="text-xs sm:text-sm font-semibold truncate max-w-[260px] sm:max-w-none">Informe para Impresión / PDF: ${countryName}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button onclick="window.print()" 
                            class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer">
                        <i data-lucide="printer" class="w-4 h-4"></i>
                        <span>Imprimir / Guardar PDF</span>
                    </button>
                    <button onclick="if(window.opener){window.close();}else if(window.history.length>1){window.history.back();}else{window.location.href='https://www.paho.org/es/regia';}" 
                            class="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>✕ Volver</span>
                    </button>
                </div>
            `;
            document.body.insertBefore(banner, document.body.firstChild);
            if (window.lucide) {
                try { lucide.createIcons(); } catch(e) {}
            }
        }

        // Listener para cerrar pestaña automáticamente al terminar la impresión si fue abierta en ventana nueva
        if (!window.__hasAfterPrintListener) {
            window.__hasAfterPrintListener = true;
            window.addEventListener('afterprint', () => {
                try {
                    if (window.opener) {
                        setTimeout(() => window.close(), 500);
                    }
                } catch(e) {}
            });
        }

        // 3. Cambiar temporalmente el título del documento para el nombre del PDF
        const originalTitle = document.title;
        try {
            document.title = `Informe_${countryName.replace(/[^\w\d-_]/g, '_')}`;
        } catch (e) {
            console.error("Failed to set print title:", e);
        }

        // 4. Disparar impresión nativa después de que se cargue el DOM y Lucide icons
        setTimeout(() => {
            try {
                window.print();
            } catch (err) {
                console.warn("Auto print failed or blocked by browser:", err);
            }
            
            // Restaurar título del documento después de abrir el diálogo
            setTimeout(() => {
                try {
                    document.title = originalTitle;
                } catch (e) {}
            }, 1000);
        }, 800);
    },

    setupGlobalEvents: function () {
        // Eventos que no dependan del renderizado inicial
        let scrollTopVisible = false;
        window.addEventListener('scroll', () => {
            const btn = document.getElementById('scroll-top-btn');
            if (!btn) return;
            const shouldShow = window.scrollY > 500;
            if (shouldShow && !scrollTopVisible) {
                scrollTopVisible = true;
                btn.classList.remove('opacity-0', 'translate-y-10');
                // Separar pointer-events del fade para que el primer tap siempre funcione
                setTimeout(() => btn.classList.remove('pointer-events-none'), 350);
            } else if (!shouldShow && scrollTopVisible) {
                scrollTopVisible = false;
                btn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
            }
        });
    },

    toggleNavSection: function (navId, catId) {
        const panel  = document.getElementById(`${navId}-panel`);
        const btn    = document.getElementById(`${navId}-btn`);
        const chevron = document.getElementById(`${navId}-chevron`);
        if (!panel) return;
        const isOpen = !panel.classList.contains('hidden');
        if (isOpen) {
            panel.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
            chevron.style.transform = '';
        } else {
            panel.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
            chevron.style.transform = 'rotate(180deg)';
            // Scroll a la sección automáticamente al abrir (en mobile)
            if (window.innerWidth < 1024) {
                setTimeout(() => this.scrollToSection(catId), 50);
            }
        }
        this.notifyResize();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
