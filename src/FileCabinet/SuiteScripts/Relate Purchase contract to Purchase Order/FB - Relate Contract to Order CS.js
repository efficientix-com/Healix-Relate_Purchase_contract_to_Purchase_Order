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
 * Last modification   -> 22/05/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> FB - Relate Contract to Order CS <customscript_fb_relate_contract_order_cs>
 */
define(['N/log', 'N/record', 'N/search', 'N/ui/dialog', 'N/ui/message', 'N/currentRecord'],
/**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{dialog} dialog
 * @param{message} message
 */
function(log, record, search, dialog, message, currentRecord) {
    var contrato = '';
    var bandera = false;
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
        try {
            log.debug({title:'scriptContest', details:scriptContext});
            if (scriptContext == true) {
                log.debug({title:'Data', details:'Data'});
                return true;
            }
            var currentRecord = scriptContext.currentRecord;
            var valueReturn;
            var vendor = currentRecord.getValue({fieldId: 'entity'});
            var locatioShipTo = currentRecord.getValue({fieldId: 'shipaddresslist'});
            console.log('firsInfo', {vendor: vendor, locatioShipTo: locatioShipTo} );
            log.debug({title:'firstInformation', details:{vendor: vendor, locatioShipTo: locatioShipTo}});
            if (locatioShipTo) {
                var purchasecontractSearchObj = search.create({
                    type: search.Type.PURCHASE_CONTRACT,
                    filters:
                    [
                       ["custbody_tkio_hl_ship_to_con","anyof",locatioShipTo], 
                       "AND", 
                       ["vendor.internalid","anyof",vendor], 
                       "AND", 
                       ["mainline","is","F"]
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
                       search.createColumn({name: "tranid", label: "Número de documento"})
                    ]
                });
                var myPagedData = purchasecontractSearchObj.runPaged({
                    pageSize: 1000
                });
                log.debug({title:'results', details:myPagedData.count});
                console.log('results', myPagedData.count);
                if (myPagedData.count == 1) {
                    var contractId, shipTo;
                    myPagedData.pageRanges.forEach(function(pageRange){
                        var myPage = myPagedData.fetch({index: pageRange.index});
                        myPage.data.forEach(function(result){
                            contractId = result.getValue({name: 'internalid'});
                            shipTo = result.getValue({name: 'custbody_tkio_hl_ship_to_con'});
                        });
                    });
                    log.debug({title:'Datos found', details:{contractId: contractId, shipTo: shipTo}});
                    console.log('Data found', {contractId: contractId, shipTo: shipTo});
                    if (shipTo && contractId) {
                        var numLines = currentRecord.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug({title:'numOfLines', details:numLines});
                        for (var line = 0; line < numLines; line++) {
                            var lineNum = currentRecord.selectLine({
                                sublistId: 'item',
                                line: line
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'purchasecontract',
                                value: contractId,
                                ignoreFieldChange: true
                            });
                            currentRecord.commitLine({
                                sublistId: 'item'
                            });
                        }
                        return true;
                    }
                }else if(myPagedData.count > 1){
                    var contractId, contractName;
                    var hmtlInsert = '<label for="select_contract">Please select one of the following contracts for the purchase order:</label><br><br>';
                    hmtlInsert = hmtlInsert + '<select name="contract" id="select_contract" >';
                    hmtlInsert = hmtlInsert + '<option value="">Selecciona una opción</option>';
                    myPagedData.pageRanges.forEach(function(pageRange){
                        var myPage = myPagedData.fetch({index: pageRange.index});
                        myPage.data.forEach(function(result){
                            contractId = result.getValue({name: 'internalid'});
                            contractName = result.getValue({name: 'tranid'});
                            hmtlInsert = hmtlInsert + '<option value="'+contractId+'">' + contractName + '</option>';
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
                    console.log('selectContrato', selectcontrato);
                    console.log('contarto ', contrato);
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
                    var numLines = currentRecord.getLineCount({
                        sublistId: 'item'
                    });
                    log.debug({title:'numOfLines', details:numLines});
                    for (var line = 0; line < numLines; line++) {
                        var lineNum = currentRecord.selectLine({
                            sublistId: 'item',
                            line: line
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'purchasecontract',
                            value: '',
                            ignoreFieldChange: true
                        });
                        currentRecord.commitLine({
                            sublistId: 'item'
                        });
                    }
                    return true;
                }
            }else{
                var numLines = currentRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug({title:'numOfLines', details:numLines});
                for (var line = 0; line < numLines; line++) {
                    var lineNum = currentRecord.selectLine({
                        sublistId: 'item',
                        line: line
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'purchasecontract',
                        value: '',
                        ignoreFieldChange: true
                    });
                    currentRecord.commitLine({
                        sublistId: 'item'
                    });
                }
                return true;
            }
        } catch (saveRecordError) {
            log.error({title:'saveRecord', details:saveRecordError});
        }
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
        log.debug({title:'success with value ', details:{result: result, contrato, contrato}});
        var valueReturn;
        var myRecord = currentRecord.get();
        if (result != false || contrato == '') {
            var numLines = myRecord.getLineCount({
                sublistId: 'item'
            });
            log.debug({title:'numOfLines', details:numLines});
            for (var line = 0; line < numLines; line++) {
                var lineNum = myRecord.selectLine({
                    sublistId: 'item',
                    line: line
                });
                myRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'purchasecontract',
                    value: contrato,
                    ignoreFieldChange: true
                });
                myRecord.commitLine({
                    sublistId: 'item'
                });
            }
            log.debug({title:'Fin del seteo', details:'Fin del seteo'});
            valueReturn = true;
            saveRecord(true);
            // return true;
        }else{
            valueReturn = false;
            // return false;
        }
        log.debug({title:'valueReturn', details:valueReturn});
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
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
