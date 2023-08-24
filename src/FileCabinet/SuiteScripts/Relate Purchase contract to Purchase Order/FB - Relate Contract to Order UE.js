/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @name FB - Relate Contract to Order UE.js
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@freebug.mx>
 * @summary This script will match existing contracts to a purchase order when saving the transaction.
 * @copyright Tekiio México 2023
 * 
 * Client              -> Healix
 * Last modification   -> 24/08/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> FB - Relate Contract to Order UE <customscript_fb_relate_contract_order_ue>
 */
define(['N/log', 'N/search', 'N/runtime', 'N/record'],
    /**
 * @param{log} log
 * @param{search} search
 */
    (log, search, runtime, record) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            // log.debug({ title:'Beforload Event', details:scriptContext });
            // log.debug({ title:'eventType', details:scriptContext.type });
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            try {
                log.debug({ title:'scriptContext eventType', details:scriptContext.type });
                var newRecord = scriptContext.newRecord;
                var oldRecord = scriptContext.oldRecord;
                let statusOld = oldRecord.getValue({fieldId: 'approvalstatus'});
                let statusNew = newRecord.getValue({fieldId: 'approvalstatus'});
                log.debug({ title:'status', details:{old: statusOld, new: statusNew} });
                var scriptObj = runtime.getCurrentScript();
                var vendor  = newRecord.getValue({fieldId: 'entity'});
                var locatioShipTo = newRecord.getValue({fieldId: 'shipaddresslist'});
                log.debug({title:'firstInformation', details:{vendor: vendor, locatioShipTo: locatioShipTo, governance: scriptObj.getRemainingUsage()}});
                var numLines = newRecord.getLineCount({
                    sublistId: 'item'
                });
                if (locatioShipTo) {
                    var linesTrans = {};
                    var itemLine, contratoLine, cantidadLine, unidadLine, estadoLine;
                    // log.debug({title:'numLines', details:numLines});
                    var arrayAuxItems = [];
                    for (var line = 0; line < numLines; line++) {
                        itemLine = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: line
                        });
                        contratoLine = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'purchasecontract',
                            line: line
                        });
                        cantidadLine = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: line
                        });
                        unidadLine = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitconversionrate',
                            line: line
                        });
                        estadoLine = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_fb_contract_related_by',
                            line: line
                        });
                        log.debug({title:'validacion', details:estadoLine});
                        if (estadoLine == '' || estadoLine == 1 || !estadoLine || (statusOld==1 && statusNew==2)) {
                            linesTrans[line] = {item: itemLine, estado: estadoLine, contrato: contratoLine, unidad: unidadLine, cantidad: cantidadLine};
                            arrayAuxItems.push(itemLine);
                        }
                    }
                    var linePending = Object.keys(linesTrans);
                    // log.debug({title:'linepending.length', details:linePending.length});
                    log.debug({title:'linetrans', details:linesTrans});
                    if (linePending.length > 0) {
                        // log.debug({title:'Validaciones pendientes', details:'Validaciones pendientes'});
                        var purchasecontractSearchObj = search.create({
                            type: search.Type.PURCHASE_CONTRACT,
                            filters:
                            [
                                ["custbody_tkio_hl_ship_to_con","anyof",locatioShipTo], 
                                "AND", 
                                ["vendor.internalid","anyof",vendor], 
                                "AND", 
                                ["mainline","is","F"],
                                "AND",
                                ["item.internalid","anyof",arrayAuxItems],
                                "AND", 
                                [["enddate","onorafter","today"],"OR",["enddate","isempty",""]]
                            ],
                            columns:
                            [
                                search.createColumn({name: "internalid", label: "ID interno"}),
                            search.createColumn({name: "custbody_tkio_hl_ship_to_con", label: "Ship To Contract"}),
                            search.createColumn({
                                name: "entityid",
                                join: "vendor",
                                label: "Nombre"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "vendor",
                                label: "ID interno"
                            }),
                            search.createColumn({name: "trandate", label: "Fecha"}),
                            search.createColumn({name: "unitid", label: "Unit Id"}),
                            search.createColumn({name: "tranid", label: "Número de documento"}),
                            search.createColumn({name: "rate", label: "Item rate 1"}),
                            search.createColumn({
                                name: "internalid",
                                join: "item",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "trandate",
                                sort: search.Sort.ASC,
                                label: "Fecha"
                            })
                            ]
                        });
                        var myPagedData = purchasecontractSearchObj.runPaged({
                            pageSize: 1000
                        });
                        log.debug({title:'results', details:myPagedData.count});
                        if (myPagedData.count > 0) {
                            var contractId, itemId, itemRate;
                            var contractsResult = [];
                            var arrayAux = [];
                            var arrayAuxItems = [];
                            myPagedData.pageRanges.forEach(function(pageRange){
                                var myPage = myPagedData.fetch({index: pageRange.index});
                                myPage.data.forEach(function(result){
                                    contractId = result.getValue({name: 'internalid'});
                                    itemId = result.getValue({
                                        name: "internalid",
                                        join: "item"
                                    });
                                    itemRate = result.getValue({name: 'rate'});
                                    // if (arrayAux.indexOf(contractId) == -1) {
                                        contractsResult.push({item_id: itemId, contract: contractId, item_rate: itemRate});
                                        // arrayAux.push(contractId);
                                        arrayAuxItems.push(itemId);
                                    // }
                                });
                            });
                            log.debug({title:'contractsResult', details:contractsResult});
                            log.debug({title:'linesTrans', details:linesTrans});
                            log.debug({title:'linepending', details:linePending});
                            for (var lineSet = 0; lineSet < linePending.length; lineSet++) {
                                var lineToSet = linePending[lineSet]; // linea pendiente a validar
                                var itemToSet = linesTrans[lineToSet].item; // articulo en la linea pendiente
                                var lineContract = arrayAuxItems.indexOf(itemToSet); // indice del contrato a utilizar
                                // log.debug({title:'info', details:{linetoset: lineToSet, itemToSet: itemToSet, lineContract: lineContract}});
                                if (lineContract != -1) { // existe el contrato
                                    var contract = contractsResult[lineContract].contract;
                                    var rate = contractsResult[lineContract].item_rate;
                                    // log.debug({title:'Data to use', details:{contract: contract, rate: rate}});
                                    newRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_fb_contract_related_by',
                                        line: lineToSet,
                                        value: 3
                                    });
                                    newRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'purchasecontract',
                                        line: lineToSet,
                                        value: contract
                                    });
                                    var unidadesPO = linesTrans[lineToSet].unidad;
                                    // var cantidadPO = linesTrans[lineToSet].cantidad;
                                    // var newRateItem = unidadesPO*cantidadPO*rate;
                                    var newRateItem = unidadesPO*rate;
                                    // log.debug({title:'newRateItem', details:newRateItem});
                                    newRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        line: lineToSet,
                                        value: newRateItem
                                    });
                                }else{ // no hay contratos para esta linea
                                    newRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_fb_contract_related_by',
                                        line: lineToSet,
                                        value: 5
                                    });
                                    newRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'purchasecontract',
                                        line: lineToSet,
                                        value: ''
                                    });
                                }
                            }
                        }else{
                            for (var line = 0; line < linePending.length; line++) {
                                var lineSet = linePending[line];
                                newRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_fb_contract_related_by',
                                    line: lineSet,
                                    value: 5
                                });
                                newRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'purchasecontract',
                                    line: lineSet,
                                    value: ''
                                });
                            }
                            log.debug('Fin sin contratos', 'Governance: ' + scriptObj.getRemainingUsage());
                        }
                    }
                    log.debug('Fin validaciones', 'Governance: ' + scriptObj.getRemainingUsage());
                }else{
                    log.debug('Fin sin ubicacion', 'Governance: ' + scriptObj.getRemainingUsage());
                    for (var line = 0; line < numLines; line++) {
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_fb_contract_related_by',
                            line: line,
                            value: 4
                        });
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'purchasecontract',
                            line: line,
                            value: ''
                        });
                    }
                }
            } catch (error) {
                log.error({title:'beforeSubmit', details:error});
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try {
                if (scriptContext.type == scriptContext.UserEventType.DROPSHIP) {
                    log.debug({ title:'eventType', details:scriptContext.type });
                    var scriptRecord = scriptContext.newRecord;
                    var idRecord = scriptRecord.id;
                    log.debug({ title:'idRecord', details:idRecord });
                    var newRecord = record.load({
                        type: record.Type.PURCHASE_ORDER,
                        id: idRecord
                    });
                    var scriptObj = runtime.getCurrentScript();
                    var vendor  = newRecord.getValue({fieldId: 'entity'});
                    var locatioShipTo = newRecord.getValue({fieldId: 'shipaddresslist'});
                    log.debug({title:'firstInformation', details:{vendor: vendor, locatioShipTo: locatioShipTo, governance: scriptObj.getRemainingUsage()}});
                    var numLines = newRecord.getLineCount({
                        sublistId: 'item'
                    });
                    if (locatioShipTo) {
                        var linesTrans = {};
                        var itemLine, contratoLine, cantidadLine, unidadLine, estadoLine;
                        // log.debug({title:'numLines', details:numLines});
                        var arrayAuxItems = [];
                        for (var line = 0; line < numLines; line++) {
                            itemLine = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: line
                            });
                            contratoLine = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'purchasecontract',
                                line: line
                            });
                            cantidadLine = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: line
                            });
                            unidadLine = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'unitconversionrate',
                                line: line
                            });
                            estadoLine = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_fb_contract_related_by',
                                line: line
                            });
                            log.debug({title:'validacion', details:estadoLine});
                            // if (estadoLine == '' || estadoLine == 1 || !estadoLine) {
                                linesTrans[line] = {item: itemLine, estado: estadoLine, contrato: contratoLine, unidad: unidadLine, cantidad: cantidadLine};
                                arrayAuxItems.push(itemLine);
                            // }
                        }
                        var linePending = Object.keys(linesTrans);
                        // log.debug({title:'linepending.length', details:linePending.length});
                        log.debug({title:'linetrans', details:linesTrans});
                        if (linePending.length > 0) {
                            // log.debug({title:'Validaciones pendientes', details:'Validaciones pendientes'});
                            var purchasecontractSearchObj = search.create({
                                type: search.Type.PURCHASE_CONTRACT,
                                filters:
                                [
                                    ["custbody_tkio_hl_ship_to_con","anyof",locatioShipTo], 
                                    "AND", 
                                    ["vendor.internalid","anyof",vendor], 
                                    "AND", 
                                    ["mainline","is","F"],
                                    "AND",
                                    ["item.internalid","anyof",arrayAuxItems],
                                    "AND", 
                                    [["enddate","onorafter","today"],"OR",["enddate","isempty",""]]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "internalid", label: "ID interno"}),
                                search.createColumn({name: "custbody_tkio_hl_ship_to_con", label: "Ship To Contract"}),
                                search.createColumn({
                                    name: "entityid",
                                    join: "vendor",
                                    label: "Nombre"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    join: "vendor",
                                    label: "ID interno"
                                }),
                                search.createColumn({name: "trandate", label: "Fecha"}),
                                search.createColumn({name: "unitid", label: "Unit Id"}),
                                search.createColumn({name: "tranid", label: "Número de documento"}),
                                search.createColumn({name: "rate", label: "Item rate 1"}),
                                search.createColumn({
                                    name: "internalid",
                                    join: "item",
                                    label: "Internal ID"
                                }),
                                search.createColumn({
                                    name: "trandate",
                                    sort: search.Sort.ASC,
                                    label: "Fecha"
                                })
                                ]
                            });
                            var myPagedData = purchasecontractSearchObj.runPaged({
                                pageSize: 1000
                            });
                            log.debug({title:'results', details:myPagedData.count});
                            if (myPagedData.count > 0) {
                                var contractId, itemId, itemRate;
                                var contractsResult = [];
                                var arrayAux = [];
                                var arrayAuxItems = [];
                                myPagedData.pageRanges.forEach(function(pageRange){
                                    var myPage = myPagedData.fetch({index: pageRange.index});
                                    myPage.data.forEach(function(result){
                                        contractId = result.getValue({name: 'internalid'});
                                        itemId = result.getValue({
                                            name: "internalid",
                                            join: "item"
                                        });
                                        itemRate = result.getValue({name: 'rate'});
                                        // if (arrayAux.indexOf(contractId) == -1) {
                                            contractsResult.push({item_id: itemId, contract: contractId, item_rate: itemRate});
                                            // arrayAux.push(contractId);
                                            arrayAuxItems.push(itemId);
                                        // }
                                    });
                                });
                                log.debug({title:'contractsResult', details:contractsResult});
                                log.debug({title:'linesTrans', details:linesTrans});
                                log.debug({title:'linepending', details:linePending});
                                for (var lineSet = 0; lineSet < linePending.length; lineSet++) {
                                    var lineToSet = linePending[lineSet]; // linea pendiente a validar
                                    var itemToSet = linesTrans[lineToSet].item; // articulo en la linea pendiente
                                    var lineContract = arrayAuxItems.indexOf(itemToSet); // indice del contrato a utilizar
                                    // log.debug({title:'info', details:{linetoset: lineToSet, itemToSet: itemToSet, lineContract: lineContract}});
                                    if (lineContract != -1) { // existe el contrato
                                        var contract = contractsResult[lineContract].contract;
                                        var rate = contractsResult[lineContract].item_rate;
                                        // log.debug({title:'Data to use', details:{contract: contract, rate: rate}});
                                        newRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_fb_contract_related_by',
                                            line: lineToSet,
                                            value: 3
                                        });
                                        newRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'purchasecontract',
                                            line: lineToSet,
                                            value: contract
                                        });
                                        var unidadesPO = linesTrans[lineToSet].unidad;
                                        // var cantidadPO = linesTrans[lineToSet].cantidad;
                                        // var newRateItem = unidadesPO*cantidadPO*rate;
                                        var newRateItem = unidadesPO*rate;
                                        // log.debug({title:'newRateItem', details:newRateItem});
                                        newRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'rate',
                                            line: lineToSet,
                                            value: newRateItem
                                        });
                                    }else{ // no hay contratos para esta linea
                                        newRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_fb_contract_related_by',
                                            line: lineToSet,
                                            value: 5
                                        });
                                        newRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'purchasecontract',
                                            line: lineToSet,
                                            value: ''
                                        });
                                    }
                                }
                            }else{
                                for (var line = 0; line < linePending.length; line++) {
                                    var lineSet = linePending[line];
                                    newRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_fb_contract_related_by',
                                        line: lineSet,
                                        value: 5
                                    });
                                    newRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'purchasecontract',
                                        line: lineSet,
                                        value: ''
                                    });
                                }
                                log.debug('Fin sin contratos', 'Governance: ' + scriptObj.getRemainingUsage());
                            }
                        }
                        log.debug('Fin validaciones', 'Governance: ' + scriptObj.getRemainingUsage());
                    }else{
                        log.debug('Fin sin ubicacion', 'Governance: ' + scriptObj.getRemainingUsage());
                        for (var line = 0; line < numLines; line++) {
                            newRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_fb_contract_related_by',
                                line: line,
                                value: 4
                            });
                            newRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'purchasecontract',
                                line: line,
                                value: ''
                            });
                        }
                    }
                    let saveOrder = newRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                }
            } catch (error) {
                log.error({ title:'afterSubmit', details:error });
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
