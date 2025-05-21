// Datos de las empresas
const empresasData = {
    empresas: [
        {
            nombre: "ACERTAR EMPRESARIAL SAS",
            nit: "901.008.683-5",
            contratos: ["C1914", "C2029"],
            logo: "acertar_empresarial.png"
        },
        {
            nombre: "ATLANTIS TECHNOLOGY SAS",
            nit: "901.586.999-5",
            contratos: ["C2018", "C2031"],
            logo: "atlantis_technology.png"
        },
        {
            nombre: "INVERSIONES GENESIS",
            nit: "901.282.863-7",
            contratos: ["C1792", "C1816"],
            logo: "inversiones_genesis.png"
        },
        {
            nombre: "INVERSIONES GOLDEN BLUE",
            nit: "901.154.582-4",
            contratos: ["C1546"],
            logo: "inversiones_golden_blue.png"
        },
        {
            nombre: "JUEGOS MONTE CARLO",
            nit: "901.280.521-4",
            contratos: ["C2042"],
            logo: "juegos_monte_carlo.png"
        },
        {
            nombre: "KPITAL MET SAS",
            nit: "901.287.673-7",
            contratos: ["C1590", "C1694"],
            logo: "kpital_met.png"
        },
        {
            nombre: "LEGO",
            nit: "901.079.244-9",
            contratos: ["C1535", "C1571"],
            logo: "lego.png"
        },
        {
            nombre: "LOS ALPES PLAY",
            nit: "901.508.602-4",
            contratos: ["C1800", "C1831"],
            logo: "los_alpes_play.png"
        },
        {
            nombre: "ODESSA SAS",
            nit: "901.011.779-4",
            contratos: ["C2099"],
            logo: "odessa.png"
        },
        {
            nombre: "PUERTO BELEN SAS",
            nit: "900.996.338-2",
            contratos: ["C1566", "C1653"],
            logo: "puerto_belen.png"
        },
        {
            nombre: "PLAY CITY COLOMBIA SAS",
            nit: "901.014.972-3",
            contratos: ["C2044", "C1829"],
            logo: "play_city_colombia.png"
        },
        {
            nombre: "SALGADO & AUDITORES",
            nit: "900.741.619-2",
            contratos: ["C1797", "C1832"],
            logo: "salgado_auditores.png"
        },
        {
            nombre: "SILVER TECH CO SAS",
            nit: "901.510.914-3",
            contratos: ["C1824", "C1868"],
            logo: "silver_tech.png"
        },
        {
            nombre: "STAR GAMES SAS",
            nit: "901.297.092-0",
            contratos: ["C1730", "C1770"],
            logo: "star_games.png"
        },
        {
            nombre: "JUEGOS TEXAS SAS",
            nit: "901.144.481-6",
            contratos: ["C1709"],
            logo: "juegos_texas.png"
        },
        {
            nombre: "TEXAS GROUP SAS",
            nit: "901.502.218-1",
            contratos: ["C1819"],
            logo: "texas_group.png"
        },
        {
            nombre: "GRUPO JERP SAS",
            nit: "901.502.216-7",
            contratos: ["C1954", "C1976"],
            logo: "grupo_jerp.png"
        },
        {
            nombre: "WORLD FANTASTIC SAS",
            nit: "901.263.738-3",
            contratos: ["C1867", "C2151"],
            logo: "world_fantastic.png"
        },
        {
            nombre: "DIESEL SERVICE",
            nit: "901.314.439-6",
            contratos: ["C1807", "C1966"],
            logo: "diesel_service.png"
        },
        {
            nombre: "INFRATECNOLOGIA SAS",
            nit: "901.535.556-8",
            contratos: ["C1904", "C1920"],
            logo: "infratecnologia.png"
        },
        {
            nombre: "TERRA TECNOLOGY SAS",
            nit: "901.535.653-4",
            contratos: ["C1987"],
            logo: "terra_technology.png"
        }
    ]
};

// Función para obtener los datos de una empresa
function getEmpresaData(nombreEmpresa) {
    return empresasData[nombreEmpresa] || null;
}

// Exportar las funciones y datos necesarios
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { empresasData, getEmpresaData };
} 

// Solo ejecutar código relacionado con sessionStorage si estamos en el navegador
if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
        const empresaSeleccionada = sessionStorage.getItem('empresaSeleccionada');
        if (empresaSeleccionada) {
            console.log(JSON.parse(empresaSeleccionada));
        }
    } catch (error) {
        console.error('Error al acceder a sessionStorage:', error);
    }
} 