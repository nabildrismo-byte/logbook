function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var params = e.parameter;

    // 1. Detectar Acción (Login vs Vuelo)
    var action = params.action || 'flight';

    // --- CASO A: LOGIN ---
    if (action === 'login') {
        var loginSheet = sheet.getSheetByName('Logins');
        if (!loginSheet) {
            loginSheet = sheet.insertSheet('Logins');
            loginSheet.appendRow(['FECHA', 'HORA', 'USUARIO', 'NOMBRE', 'ROL']);
        }

        var timestamp = params.timestamp ? new Date(params.timestamp) : new Date();
        var dateStr = Utilities.formatDate(timestamp, "Europe/Madrid", "dd/MM/yyyy");
        var timeStr = Utilities.formatDate(timestamp, "Europe/Madrid", "HH:mm:ss");

        loginSheet.appendRow([dateStr, timeStr, params.username, params.name, params.role]);
        return ContentService.createTextOutput("Login OK");
    }

    // --- CASO C: VALIDACIÓN ---
    else if (action === 'validate') {
        var validSheet = sheet.getSheetByName('Validaciones');
        if (!validSheet) {
            validSheet = sheet.insertSheet('Validaciones');
            validSheet.appendRow(['FECHA_ACCION', 'ID_VUELO', 'ESTADO', 'FEEDBACK', 'NOTA', 'OBS_VALIDACION']);
        } else {
            // Hotfix: Ensure headers exist if sheet exists but old columns
            var headers = validSheet.getRange(1, 1, 1, validSheet.getLastColumn()).getValues()[0];
            if (headers.indexOf('NOTA') === -1) {
                // Determine next column index (1-based)
                var nextCol = headers.length + 1;
                validSheet.getRange(1, nextCol).setValue('NOTA');
                validSheet.getRange(1, nextCol + 1).setValue('OBS_VALIDACION');
            }
        }

        var timestamp = new Date();
        var dateStr = Utilities.formatDate(timestamp, "Europe/Madrid", "dd/MM/yyyy HH:mm:ss");

        // Composite ID from client or params
        // Expected params: flightId (or composite), status, feedback, grade, remarks
        validSheet.appendRow([
            dateStr,
            params.flightId || '',
            params.status || '',
            params.feedback || '',
            params.grade || '', // ADDED GRADE
            params.remarks || '' // ADDED REMARKS
        ]);
        return ContentService.createTextOutput("Validacion OK");
    }

    // --- CASO B: VUELO (Tu lógica original) ---
    else {
        var flightSheet = sheet.getSheets()[0];

        // Mapeo EXACTO a tus columnas solicitadas
        var row = [];
        row.push(params['ALUMNO'] || '');
        row.push(params['SESIÓN'] || '');
        row.push(params['FECHA'] || '');
        row.push(params['INSTRUCTOR'] || '');
        row.push(params['MATRÍCULA'] || '');
        row.push(params['TIEMPO'] || '');
        row.push(params['REAL / SIM'] || '');
        row.push(params['PUNTUACIÓN'] || '');
        row.push(params['OBSERVACIONES'] || '');

        // Extras solicitados por ti
        row.push(params['LUGAR SALIDA'] || '');
        row.push(params['LUGAR LLEGADA'] || '');
        row.push(params['PROCEDIMIENTOS'] || '');
        row.push(params['MANIOBRAS'] || '');

        flightSheet.appendRow(row);
        return ContentService.createTextOutput("Vuelo OK");
    }
}

function doGet(e) {
    // Función para leer datos (Sincronización hacia la App)
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var params = e.parameter;
    var table = params.table || 'flights';  // Default to flights if not specified

    var targetSheet;

    if (table === 'logins') {
        targetSheet = sheet.getSheetByName('Logins');
    } else if (table === 'validations') {
        targetSheet = sheet.getSheetByName('Validaciones');
    } else {
        // Default: First sheet (Flights)
        targetSheet = sheet.getSheets()[0];
    }

    if (!targetSheet) {
        // If sheet doesn't exist, return empty list
        return ContentService.createTextOutput(JSON.stringify([]))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // Obtener todos los datos
    var range = targetSheet.getDataRange();

    // Check if sheet is empty
    if (range.getLastRow() < 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
            .setMimeType(ContentService.MimeType.JSON);
    }

    var data = range.getValues();

    // La primera fila son cabeceras, las quitamos o las procesamos
    // Devolvemos JSON
    var headers = data[0];
    var rows = data.slice(1);

    var result = rows.map(function (row) {
        var obj = {};
        headers.forEach(function (header, i) {
            obj[header] = row[i];
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}
