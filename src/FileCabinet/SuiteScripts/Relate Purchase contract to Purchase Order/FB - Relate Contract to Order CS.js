/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @name FB - Relate Contract to Order CS.js
 * @version 1.0
 * @author Dylan Mendoza <dylan.mendoza@freebug.mx>
 * @summary This script will match existing contracts to a purchase order when saving the transaction.
 * @copyright Tekiio México 2023
 * 
 * Client              -> Healix
 * Last modification   -> 23/05/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> FB - Relate Contract to Order CS <customscript_fb_relate_contract_order_cs>
 */
define(['N/log', 'N/record', 'N/search', 'N/ui/dialog', 'N/ui/message', 'N/currentRecord', 'N/runtime'],
/**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{dialog} dialog
 * @param{message} message
 */
function(log, record, search, dialog, message, currentRecord, runtime) {
    var contrato = '';
    var currIndex = '';
    var validated = false;
    var glbItem = '';
    var resetValid = false;
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function pageInit(scriptContext) {
        log.debug({title:'Data Init', details:'Data init'});
        return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        try {
            var fieldChanged = scriptContext.fieldId;
            if (fieldChanged == 'shipaddresslist') {
                resetValid = true;
                var currentRecord = scriptContext.currentRecord;
                var numLines = currentRecord.getLineCount({
                    sublistId: 'item'
                });
                for (var line = 0; line < numLines; line++) {
                    var record = currentRecord.selectLine({
                        sublistId: 'item',
                        line: line
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_fb_contract_related_by',
                        value: 1
                    });
                    currentRecord.commitLine({
                        sublistId: 'item'
                    });
                }
                resetValid = false;
            }
        } catch (error) {
            log.error({title:'validateField', details:error});
        }
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {
        
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
        try {
            log.debug({title:'firstValidation', details:{validated: validated, resetValid: resetValid}});
            if (validated == true || resetValid == true) {
                validated = false;
                return true;
            }
            var scriptObj = runtime.getCurrentScript();
            var currentRecord = scriptContext.currentRecord;
            var vendor = currentRecord.getValue({fieldId: 'entity'});
            var locatioShipTo = currentRecord.getValue({fieldId: 'shipaddresslist'});
            var itemValue = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });
            glbItem = itemValue;
            console.log('firsInfo', {vendor: vendor, locatioShipTo: locatioShipTo} );
            log.debug({title:'firstInformation', details:{vendor: vendor, locatioShipTo: locatioShipTo, itemValue: itemValue}});
            if (locatioShipTo) {
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
                       ["item.internalid","anyof",itemValue]
                    ],
                    columns:
                    [
                       search.createColumn({
                          name: "internalid",
                          sort: search.Sort.ASC,
                          label: "ID interno"
                       }),
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
                     })
                    ]
                });
                var myPagedData = purchasecontractSearchObj.runPaged({
                    pageSize: 1000
                });
                log.debug({title:'results', details:myPagedData.count});
                console.log('results', myPagedData.count);
                if (myPagedData.count == 1){
                    var contractId, shipTo, itemId, itemUnitId, itemRate;
                    var itemData = [];
                    var itemDataAux = [];
                    myPagedData.pageRanges.forEach(function(pageRange){
                        var myPage = myPagedData.fetch({index: pageRange.index});
                        myPage.data.forEach(function(result){
                            contractId = result.getValue({name: 'internalid'});
                            shipTo = result.getValue({name: 'custbody_tkio_hl_ship_to_con'});
                            itemId = result.getValue({
                                name: "internalid",
                                join: "item",
                                label: "Internal ID"
                            });
                            itemUnitId = result.getValue({name: 'unitid'});
                            itemRate = result.getValue({name: 'rate'});
                            itemData.push({item_id: itemId, item_unit_id : itemUnitId, item_rate: itemRate});
                            itemDataAux.push(itemId);
                        });
                    });
                    log.debug({title:'Datos found', details:{contractId: contractId, shipTo: shipTo}});
                    console.log('Data found', {contractId: contractId, shipTo: shipTo});
                    log.debug({title:'itemData', details:itemData});
                    console.log('itemData ', itemData);
                    if (shipTo && contractId) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'purchasecontract',
                            value: contractId,
                            ignoreFieldChange: true
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_fb_contract_related_by',
                            value: 2
                        });
                        var quantityUnit = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitconversionrate'
                        });
                        var quantityitem = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity'
                        });
                        var item = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });
                        log.debug({title:'Datos', details:{item: item, quantityUnit: quantityUnit, quantityitem: quantityitem}});
                        var lineAux = itemDataAux.indexOf(item);
                        if (lineAux!= -1) {
                            var newRateItem = quantityUnit*quantityitem*itemData[lineAux].item_rate;
                            log.debug({title:'newRateItem', details:newRateItem});
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: newRateItem,
                                ignoreFieldChange: false
                            });
                        }
                        log.debug('Fin un solo contrato', 'Governance: ' + scriptObj.getRemainingUsage());
                        return true;
                    }
                }else if(myPagedData.count > 1){
                    currIndex = currentRecord.getCurrentSublistIndex({
                        sublistId: 'item'
                    });
                    var contractId, contractName;
                    var arrayAux = [];
                    var hmtlInsert = '<label for="select_contract">The line could not be inserted. Select one of the following contracts for the purchase order line:</label><br><br>';
                    hmtlInsert = hmtlInsert + '<select name="contract" id="select_contract" >';
                    hmtlInsert = hmtlInsert + '<option value="">select an option</option>';
                    myPagedData.pageRanges.forEach(function(pageRange){
                        var myPage = myPagedData.fetch({index: pageRange.index});
                        myPage.data.forEach(function(result){
                            contractId = result.getValue({name: 'internalid'});
                            contractName = result.getValue({name: 'tranid'});
                            if (arrayAux.indexOf(contractId) == -1) {
                                hmtlInsert = hmtlInsert + '<option value="'+contractId+'">' + contractName + '</option>';
                                arrayAux.push(contractId);
                            }
                        });
                    });
                    hmtlInsert = hmtlInsert + '</select>';
                    hmtlInsert += '<script>document.getElementById("select_contract").addEventListener("change", dialogResponse); function dialogResponse(e) {console.log(e.target.value)}</script>';
                    let options = {
                        title: 'Select a contract',
                        message: hmtlInsert
                    };
                    var dialogselect = dialog.confirm(options).then(success).catch(failure);

                    console.log(document.getElementById("select_contract"));

                    var selectcontrato = document.getElementById("select_contract");

                    if(selectcontrato){
                        selectcontrato.addEventListener('change', atrapar);
                    }
                    log.debug('Fin varios contratos', 'Governance: ' + scriptObj.getRemainingUsage());
                    return true;
                }else{
                    let options = {
                        title: 'Warning',
                        message: 'There are no contracts for the selected vendor and location.'
                    };
                    var resultSelect = dialog.alert(options).then(function (value) {
                        log.debug({title:'value', details:value});
                    }).catch(failure);
                    console.log('No hay info, con ese vendedor y shipto');
                    log.debug({title:'No hay info', details:'No hay datos con ese vendedor y shipTo'});
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'purchasecontract',
                        value: ''
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_fb_contract_related_by',
                        value: 5
                    });
                    log.debug('Fin sin contratos', 'Governance: ' + scriptObj.getRemainingUsage());
                    return true;
                }
            }else{
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'purchasecontract',
                    value: ''
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_fb_contract_related_by',
                    value: 4
                });
                log.debug('Fin sin location', 'Governance: ' + scriptObj.getRemainingUsage());
                return true;
            }

        } catch (error) {
            log.error({title:'validateLine', details:error});
        }
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    }    

    function atrapar(){
        var selectcontrato = document.getElementById("select_contract");
        if(selectcontrato){
            contrato = selectcontrato.value;
        }
        console.log("Atrapar contrato", contrato);
        log.debug({title:'atrapar contrato', details:contrato});
    }

    function success(result) {
        console.log('Success with value ' + result);
        console.log('Success contrato ' + contrato);
        log.debug({title:'success with value ', details:{result: result, contrato, contrato, index: currIndex}});
        var myRecord = currentRecord.get();
        if (result != false && contrato != '') {
            var purchasecontractSearchObj = search.create({
                type: search.Type.PURCHASE_CONTRACT,
                filters:
                [
                   ["internalid","anyof",contrato],
                   "AND", 
                   ["mainline","is","F"],
                   "AND",
                   ["item.internalid","anyof",glbItem]
                ],
                columns:
                [
                   search.createColumn({
                      name: "internalid",
                      sort: search.Sort.ASC,
                      label: "ID interno"
                   }),
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
                 })
                ]
            });
            var myPagedData = purchasecontractSearchObj.runPaged({
                pageSize: 1000
            });
            log.debug({title:'results', details:myPagedData.count});
            console.log('results', myPagedData.count);
            var contractId, shipTo, itemId, itemUnitId, itemRate;
            var itemData = [];
            var itemDataAux = [];
            myPagedData.pageRanges.forEach(function(pageRange){
                var myPage = myPagedData.fetch({index: pageRange.index});
                myPage.data.forEach(function(result){
                    contractId = result.getValue({name: 'internalid'});
                    shipTo = result.getValue({name: 'custbody_tkio_hl_ship_to_con'});
                    itemId = result.getValue({
                        name: "internalid",
                        join: "item",
                        label: "Internal ID"
                    });
                    itemUnitId = result.getValue({name: 'unitid'});
                    itemRate = result.getValue({name: 'rate'});
                    itemData.push({item_id: itemId, item_unit_id : itemUnitId, item_rate: itemRate});
                    itemDataAux.push(itemId);
                });
            });
            log.debug({title:'Datos found', details:{contractId: contractId, shipTo: shipTo}});
            console.log('Data found', {contractId: contractId, shipTo: shipTo});
            log.debug({title:'itemData', details:itemData});
            console.log('itemData ', itemData);
            var record = myRecord.selectLine({
                sublistId: 'item',
                line: currIndex
            });
            myRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'purchasecontract',
                value: contrato
            });
            myRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_fb_contract_related_by',
                value: 2
            });
            var quantityUnit = myRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'unitconversionrate'
            });
            var quantityitem = myRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity'
            });
            var item = myRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });
            log.debug({title:'Datos', details:{item: item, quantityUnit: quantityUnit, quantityitem: quantityitem}});
            var lineAux = itemDataAux.indexOf(item);
            if (lineAux!= -1) {
                var newRateItem = quantityUnit*quantityitem*itemData[lineAux].item_rate;
                log.debug({title:'newRateItem', details:newRateItem});
                myRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: newRateItem,
                    ignoreFieldChange: false
                });
                validated = true;
            }
            myRecord.commitLine({
                sublistId: 'item'
            });
            validated = true;
            log.debug({title:'finValidated', details:validated});
        }else{
            validated = false;
        }
    }

    function failure(reason) {
        console.log('Failure: ' + reason);
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };
    
});
