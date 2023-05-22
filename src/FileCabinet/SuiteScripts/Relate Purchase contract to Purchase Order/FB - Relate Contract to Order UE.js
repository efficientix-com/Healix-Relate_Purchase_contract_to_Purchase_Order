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
 * Last modification   -> 19/05/2023
 * Modified by         -> Dylan Mendoza <dylan.mendoza@freebug.mx>
 * Script in NS        -> FB - Relate Contract to Order UE <customscript_fb_relate_contract_order_ue>
 */
define(['N/log', 'N/search'],
    /**
 * @param{log} log
 * @param{search} search
 */
    (log, search) => {
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
            var newRecord = scriptContext.newRecord;
            var vendor  = newRecord.getValue({fieldId: 'entity'});
            var locatioShipTo = newRecord.getValue({fieldId: 'shipaddresslist'});
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
                       search.createColumn({name: "trandate", label: "Fecha"})
                    ]
                });
                var myPagedData = purchasecontractSearchObj.runPaged({
                    pageSize: 1000
                });
                // log.debug({title:'results', details:myPagedData.count});
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
                    if (shipTo && contractId) {
                        var numLines = newRecord.getLineCount({
                            sublistId: 'item'
                        });
                        log.debug({title:'numOfLines', details:numLines});
                        for (var line = 0; line < numLines; line++) {
                            newRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'purchasecontract',
                                line: line,
                                value: contractId
                            });
                        }
                    }
                }else if(myPagedData.count > 1){
                    log.debug({title:'Varios contratos', details:'Existe más de un contrato para este vendedor y shipTo'});
                    throw 'There is more than one contract for the information entered.';
                }
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

        }

        return {beforeSubmit}

    });
