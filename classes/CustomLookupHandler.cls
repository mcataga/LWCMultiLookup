public with sharing class CustomLookupHandler {

    /**
     *
     * @param CHILD_OBJECT_API - API Name of the Child Object
     * @param CHILD_OBJECT_NAME_API - API Name of the Child Object's Name field
     * @param LOOKUP_TO_PARENT_API - Api Name of the field used to lookup from the Child Object to the Parent Object
     * @param recordId - recordId of the record that the component is placed on
     * @description Queries for records that were recently viewed by the user for the respective object
     * @return
     */
    @AuraEnabled
    public static List<RecentlyViewed> getRecentlyViewed(String CHILD_OBJECT_API, String CHILD_OBJECT_NAME_API, String LOOKUP_TO_PARENT_API, String recordId) {
        String recordQuery = 'Select Id, '+ CHILD_OBJECT_NAME_API + ', ' + LOOKUP_TO_PARENT_API + ' FROM ' + CHILD_OBJECT_API + ' WHERE Id != \'' + recordId + '\' AND LastViewedDate != NULL ORDER BY LastViewedDate DESC LIMIT 5';
        List<SObject> recentlyViewed = Database.query(recordQuery);
        if (!recentlyViewed.isEmpty()) return recentlyViewed;
        return null;
    }

    /**
     *
     *
     * @param CHILD_OBJECT_API - API Name of the Child Object
     * @param CHILD_OBJECT_NAME_API - API Name of the Child Object's Name field
     * @param LOOKUP_TO_PARENT_API - Api Name of the field used to lookup from the Child Object to the Parent Object
     * @param recordId - recordId of the record that the component is placed on
     * @param searchTerm - search term used in query
     *
     * @return List of 5 records matching records that start with the search term given by the user
     */
    @AuraEnabled
    public static List<SObject> getRecords(String CHILD_OBJECT_API, String CHILD_OBJECT_NAME_API, String LOOKUP_TO_PARENT_API, String recordId, String searchTerm ) {
        String recordQuery = 'Select Id, '+ CHILD_OBJECT_NAME_API + ', '+ LOOKUP_TO_PARENT_API + ' FROM ' + CHILD_OBJECT_API + ' WHERE Id != \'' + recordId + '\' AND ' + CHILD_OBJECT_NAME_API + ' LIKE \'' + searchTerm + '%\'  LIMIT 5';
        List<SObject> records = Database.query(recordQuery);
        if (!records.isEmpty()) return records;
        return null;
    }

    /**
     *
     *
     * @param CHILD_OBJECT_API - API Name of the Child Object
     * @param CHILD_OBJECT_NAME_API - API Name of the Child Object's Name field
     * @param LOOKUP_TO_PARENT_API - Api Name of the field used to lookup from the Child Object to the Parent Object
     * @param recordId - recordId of the record that the component is placed on
     *
     * @return List of records that are currently used in a lookup to the parent record
     */
    @AuraEnabled
    public static List<SObject> getExistingRecords(String CHILD_OBJECT_API, String CHILD_OBJECT_NAME_API, String LOOKUP_TO_PARENT_API, String recordId){
        String recordQuery = 'Select Id, '+ CHILD_OBJECT_NAME_API + ', ' + LOOKUP_TO_PARENT_API + ' FROM ' + CHILD_OBJECT_API + ' WHERE ' + LOOKUP_TO_PARENT_API + ' = \'' + recordId + '\'';
        List<SObject> records = Database.query(recordQuery);
        if (!records.isEmpty()) return records;
        return null;
    }

    /**
     *
     *
     * @param selectedRecords - list of records from the front end that need to be updated in the server side
     * @param CHILD_OBJECT_API - API Name of the Child Object
     * @param CHILD_OBJECT_NAME_API - API Name of the Child Object's Name field
     * @param LOOKUP_TO_PARENT_API - Api Name of the field used to lookup from the Child Object to the Parent Object
     * @param recordId - recordId of the record that the component is placed on
     *
     * @description updates the records to reflect which records have a lookup to the parent record if they are deselected; the lookup field is turned to null
     * @return returns success if no error has occured
     */
    @AuraEnabled
    public static String saveRecords(List<SObject> selectedRecords, String CHILD_OBJECT_API, String CHILD_OBJECT_NAME_API, String LOOKUP_TO_PARENT_API, String recordId ) {
        String recordQuery = 'SELECT Id, '+ CHILD_OBJECT_NAME_API + ', ' + LOOKUP_TO_PARENT_API + ' FROM ' + CHILD_OBJECT_API + ' WHERE ' +LOOKUP_TO_PARENT_API + ' = \'' + recordId +'\'';
        List<SObject> records = Database.query(recordQuery);
        List<SObject> recordsToNull = new List<SObject>();
        if (!records.isEmpty()) {
            Boolean found = false;
            for (SObject s:records) {
                found = false;
                for (SObject r: selectedRecords) {
                    if (s.Id == r.Id) {
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    s.put(LOOKUP_TO_PARENT_API, '');
                    recordsToNull.add(s);
                }
            }
        }
        update recordsToNull;
        if (!selectedRecords.isEmpty()) {
            for (SObject s: selectedRecords) { s.put(LOOKUP_TO_PARENT_API, recordId); }
        }
            update selectedRecords;
            return 'success';
    }

}