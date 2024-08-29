const currencyFlags = {
    "ARS": "fi-ar",
    "USD": "fi-us",
    "Dólar Blue": "fi-us",
    "EUR": "fi-eu",
    "JPY": "fi-jp",
    "GBP": "fi-gb",
    "AUD": "fi-au",
    "CAD": "fi-ca",
    "CHF": "fi-ch",
    "CNY": "fi-cn",
    "SEK": "fi-se",
    "NZD": "fi-nz",
    "MXN": "fi-mx",
    "BRL": "fi-br",
    "CLP": "fi-cl",
    "INR": "fi-in",
    "RUB": "fi-ru",
    "ZAR": "fi-za",
    "SGD": "fi-sg",
    "HKD": "fi-hk",
    "KRW": "fi-kr",
    "MYR": "fi-my",
    "THB": "fi-th",
    "IDR": "fi-id",
    "TRY": "fi-tr"
};

function updateFlag(selectorId, flagSpanId) {
    const currency = document.getElementById(selectorId).value;
    const flagClass = currencyFlags[currency];
    document.getElementById(flagSpanId).className = `fi ${flagClass} absolute right-2 top-3`;
}

function swapCurrencies() {
    const deDivisa = document.getElementById('de-divisa');
    const aDivisa = document.getElementById('a-divisa');
    const tempValue = deDivisa.value;
    deDivisa.value = aDivisa.value;
    aDivisa.value = tempValue;
    updateFlag('de-divisa', 'de-bandera');
    updateFlag('a-divisa', 'a-bandera');
    realizarConversion();
}

function guardarHistorial(historial) {
    chrome.storage.local.set({ historialConversiones: historial });
}

function cargarHistorial(callback) {
    chrome.storage.local.get(['historialConversiones'], function(result) {
        callback(result.historialConversiones || []);
    });
}

function mostrarHistorial() {
    cargarHistorial(function(historial) {
        const historialContainer = document.getElementById('historial');
        historialContainer.innerHTML = '<h2 class="historial-title">Historial de Conversiones</h2><button id="limpiar-historial" class="btn-primary p-2 rounded-lg mt-4">Limpiar Historial</button>';
        historial.forEach(entry => {
            const p = document.createElement('p');
            p.className = 'historial-entry';
            p.innerText = entry;
            historialContainer.appendChild(p);
        });

        document.getElementById('limpiar-historial').addEventListener('click', limpiarHistorial);
    });
}

function limpiarHistorial() {
    chrome.storage.local.remove('historialConversiones', function() {
        mostrarHistorial();
    });
}

async function realizarConversion() {
    const monto = document.getElementById('monto').value;
    const deDivisa = document.getElementById('de-divisa').value;
    const aDivisa = document.getElementById('a-divisa').value;

    if (monto === '' || isNaN(monto)) {
        document.getElementById('resultado-container').style.display = 'none';
        return;
    }

    let apiUrl;
    let tasa;

    try {
        if (deDivisa === 'Dólar Blue' || aDivisa === 'Dólar Blue') {
            apiUrl = 'https://api.bluelytics.com.ar/v2/latest';
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (deDivisa === 'Dólar Blue') {
                tasa = data.blue.value_sell;
                calcularResultado(monto, tasa, 'USD blue', aDivisa);
            } else {
                tasa = 1 / data.blue.value_sell;
                calcularResultado(monto, tasa, deDivisa, 'USD blue');
            }
            actualizarHistorial(deDivisa, aDivisa, tasa);
        } else {
            apiUrl = `https://api.exchangerate-api.com/v4/latest/${deDivisa}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            tasa = data.rates[aDivisa];
            calcularResultado(monto, tasa, deDivisa, aDivisa);
            actualizarHistorial(deDivisa, aDivisa, tasa);
        }
    } catch (error) {
        console.error('Error al obtener la tasa de cambio:', error);
    }
}

function calcularResultado(monto, tasa, deDivisa, aDivisa) {
    const resultado = monto * tasa;
    document.getElementById('resultado-details').innerText = `1 $${deDivisa} = ${tasa.toFixed(4)} $${aDivisa}`;
    document.getElementById('resultado-amount').innerText = `${monto} $${deDivisa} = ${resultado.toFixed(2)} $${aDivisa}`;
    document.getElementById('resultado-container').style.display = 'block';
}

function actualizarHistorial(deDivisa, aDivisa, tasa) {
    cargarHistorial(function(historial) {
        const fecha = new Date().toLocaleString();
        const entrada = `${fecha}: 1 $${deDivisa} = ${tasa.toFixed(4)} ${aDivisa}`;
        historial.unshift(entrada);
        guardarHistorial(historial);
        mostrarHistorial();
    });
}

document.getElementById('monto').addEventListener('input', realizarConversion);
document.getElementById('de-divisa').addEventListener('change', () => {
    updateFlag('de-divisa', 'de-bandera');
    realizarConversion();
});
document.getElementById('a-divisa').addEventListener('change', () => {
    updateFlag('a-divisa', 'a-bandera');
    realizarConversion();
});
document.getElementById('intercambiar').addEventListener('click', swapCurrencies);

document.addEventListener('DOMContentLoaded', () => {
    updateFlag('de-divisa', 'de-bandera');
    updateFlag('a-divisa', 'a-bandera');
    mostrarHistorial();
});
