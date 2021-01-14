import {LightningElement, api, track} from 'lwc';
import getRecentlyViewed from '@salesforce/apex/CustomLookupHandler.getRecentlyViewed';
import getRecords from '@salesforce/apex/CustomLookupHandler.getRecords';
import getExistingRecords from '@salesforce/apex/CustomLookupHandler.getExistingRecords';
import saveRecord from '@salesforce/apex/CustomLookupHandler.saveRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

const SEARCH_DELAY = 300;
export default class CustomLookup extends NavigationMixin(LightningElement) {

    /**
     * @var PARENT_OBJECT_API
     * @type String
     * @description contains the API Name of the Parent object provided by the user after placing the component on the lightning record page
     * */

    @api PARENT_OBJECT_API;

    /**
     * @var LOOKUP_TO_PARENT_API
     * @type String
     * @description contains the API Name of the field that looks up to the Parent Object from the Child Object
     * provided by the user after placing the component on the lightning record page
     * */

    @api LOOKUP_TO_PARENT_API;

    /**
     * @var CHILD_OBJECT_API
     * @type String
     * @description contains the API Name of the Child object
     * provided by the user after placing the component on the lightning record page
     * */

    @api CHILD_OBJECT_API;

    /**
     * @var COMPONENT_LABEL
     * @type String
     * @description contains the label that the component displays
     * provided by the user after placing the component on the lightning record page
     * */

    @api COMPONENT_LABEL;

    /**
     * @var CHILD_OBJECT_NAME_API
     * @type String
     * @description contains the API Name of the Name field of the Child object (e.g Case => CaseNumber, Account => Name)
     * provided by the user after placing the component on the lightning record page
     * */

    @api CHILD_OBJECT_NAME_API;
    /**
     * @var recordId
     * @type String
     * @Description recordId from the record page that the component is placed on
     * */
    @api recordId;

    /**
     * @var RELATIONSHIP_API_NAME
     * @type String
     * @Description Api Name of the relationship between Parent object => child object
     * provided by the user after placing the component on the lightning record page
     * */
    @api RELATIONSHIP_API_NAME;
    /**
     * @var searchThrottlingTimeout
     * @type Number
     * @description used to set the search term timeout period
     * */

    @track searchThrottlingTimeout;
    /**
     * @var searchTerm
     * @type String
     * @description used for tracking the search term input
     * */
    @track searchTerm = '';
    /**
     * @var searchTermProtected
     * @type String
     * @description used for converting the search term to have its special characters protected so that the query doesn't error out
     * */
    @track searchTermProtected = '';
    /**
     * @var recentlyViewedRecords
     * @type Array
     * @description contains all recently viewed records
     * */
    @track recentlyViewedRecords = [];
    /**
     * @var recentlyViewedEmpty
     * @type Boolean
     * @description used for displaying the "Recently Viewed Records" div in the front end
     * */
    @track recentlyViewedEmpty = true;
    /**
     * @var displayRecentlyViewed
     * @type Boolean
     * @description used for displaying the Recently Viewed records array in the front end
     * */
    @track displayRecentlyViewed = false;
    /**
     * @var objectRecords
     * @type Array
     * @description contains all the queried object records
     * */
    @track objectRecords = [];
    /**
     * @var displayRecords
     * @type Boolean
     * @description used for displaying the object Records array in the front end
     * */
    @track displayRecords = false;
    /**
     * @var selectedRecords
     * @type Array
     * @description contains all the selected object records
     * */
    @track selectedRecords = [];
    /**
     * @var selectedRecordsMap
     * @type Map
     * @description contains k,v to the selected records (Id => object)
     * */
    @track selectedRecordsMap = {};
    /**
     * @var modified
     * @type Boolean
     * @description Tracks if there were records deleted or added to the selected records
     * */
    @track modified = false;

    @track url;
    /**
     * @method ConnectedCallback
     * @description queries for all existing records of the Child object that have a lookup to the Parent object and stores them into the selectedRecords array and selectedRecordsMap
     * */
    connectedCallback() {
        getExistingRecords({CHILD_OBJECT_API: this.CHILD_OBJECT_API, CHILD_OBJECT_NAME_API: this.CHILD_OBJECT_NAME_API, LOOKUP_TO_PARENT_API:  this.LOOKUP_TO_PARENT_API, recordId: this.recordId}).then(existingRecords => {
            if(existingRecords) {
                this.selectedRecords = existingRecords;
                if(this.selectedRecords[0].Name == null) this.convertPropertyToName(this.selectedRecords);
            }
                this.selectedRecordsMap = new Map();
                this.selectedRecords.forEach(object => {
                    this.selectedRecordsMap.set(object.Id, object);
                });
        });
        this.objectRelatedPageReference = {
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'view',
                relationshipApiName: this.RELATIONSHIP_API_NAME,
                objectApiName: this.PARENT_OBJECT_API,
            }
        };
        this[NavigationMixin.GenerateUrl](this.objectRelatedPageReference)
            .then(url => {
                this.url = url;
                console.log(this.url);
            });

    }
    /**
     * @method handleSearchTermChange
     * @description called when the user changes their input and after a short delay(to account for typing), queries for existing records starting with that name
     * */
    handleSearchTermChange(e) {
        this.searchTerm = e.target.value;
        //protects special characters by prepending a "\" to the front of each special character"
        this.searchTermProtected = this.searchTerm.replace(/[-'<>*()?]/g, "\\$&");
            // search throttling
        if (this.searchThrottlingTimeout) clearTimeout(this.searchThrottlingTimeout);
        this.searchThrottlingTimeout = setTimeout(() => {
                if (this.searchTerm) {
                    this.displayRecentlyViewed = false;
                    this.queryForSearchTerm();
                    this.displayRecords = true;
                }
                else {
                    this.queryForRecentlyViewed();
                    this.displayRecentlyViewed = true;
                    this.displayRecords = false;
                }
            },
            SEARCH_DELAY
        );
    }
    /**
     * @method queryForSearchTerm
     * @description makes a call to Apex to query for records that start with the search term input limited to 5 records returned
     * */
    queryForSearchTerm() {
        getRecords({CHILD_OBJECT_API: this.CHILD_OBJECT_API, CHILD_OBJECT_NAME_API: this.CHILD_OBJECT_NAME_API, LOOKUP_TO_PARENT_API: this.LOOKUP_TO_PARENT_API, searchTerm: this.searchTermProtected, recordId: this.recordId}).then(objectRecords => {
            this.objectRecords = objectRecords;
            if (this.objectRecords) {
                if(this.objectRecords[0].Name == null) this.convertPropertyToName(this.objectRecords);
                this.checkListForSelectedRecords(this.objectRecords);
            }
        });
    }
    /**
     * @method queryForRecentlyViewed
     * @description makes a call to Apex to query for recently viewed records limited to 5 records returned
     * */
    queryForRecentlyViewed() {
        getRecentlyViewed({CHILD_OBJECT_API: this.CHILD_OBJECT_API, CHILD_OBJECT_NAME_API: this.CHILD_OBJECT_NAME_API, LOOKUP_TO_PARENT_API: this.LOOKUP_TO_PARENT_API, recordId: this.recordId}).then(recentlyViewedRecords => {
            this.recentlyViewedRecords = recentlyViewedRecords;
            if (this.recentlyViewedRecords == null) {
                this.recentlyViewedEmpty = true;
                this.recentlyViewedRecords = [];
            }
            else {
                this.checkListForSelectedRecords(this.recentlyViewedRecords);
                if (this.recentlyViewedRecords.length >= 1) {
                    if(this.recentlyViewedRecords[0].Name == null) this.convertPropertyToName(this.recentlyViewedRecords);
                    this.displayRecentlyViewed = true;
                    this.recentlyViewedEmpty = false;
                }
            }
        });
    }
    /**
     * @method checkListForSelectedRecords
     * @description removes records from Queries that contain records that are already selected
     * */
    checkListForSelectedRecords(array) {
        for (let i = 0; i < array.length; i++) {
            if (this.selectedRecordsMap.has(array[i].Id)) {
                array.splice(i,1);
                i--;
            }
        }
    }
    /**
     * @method handleSelectElement
     * @description called when the user clicks on one of the records and sets those displays to false
     * */
    handleSelectElement(e) {
        this.modified = true;
        if (this.displayRecentlyViewed) {
            this.selectElement(this.recentlyViewedRecords, e);
            this.displayRecentlyViewed = false;
        }
        if (this.displayRecords) {
            this.selectElement(this.objectRecords, e);
            this.displayRecords = false;
        }
        if (!this.recentlyViewedRecords.length > 0) this.recentlyViewedEmpty = true;
    }
    /**
     * @method selectElement
     * @description adds selected records to the selectedRecords array and selectedRecordsMap map
     * */
    selectElement(array, e) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].Id === e.currentTarget.dataset.itemid) {
                this.selectedRecords.push(array[i]);
                this.selectedRecordsMap.set(array[i].Id, array[i]);
                array.splice(i, 1);
                break;
            }
        }
    }
    /**
     * @method convertPropertyName
     * @description if the object's attribute for the record names isn't "Name" convert it to Name and delete the other attribute
     * */
    convertPropertyToName(array) {
        for (let o of array) {
            o.Name = o[this.CHILD_OBJECT_NAME_API];
            delete o[this.CHILD_OBJECT_NAME_API];
        }
    }
    /**
     * @method handleDeleteElement
     * @description deletes the record from the selectedRecords array as well as the selectedRecordsMap
     * */
    handleDeleteElement(e){
        this.modified= true;
        for (let i = 0; i<this.selectedRecords.length; i++) {
            if (this.selectedRecords[i].Id === e.detail){ this.selectedRecords.splice(i, 1); break; }
        }
        this.selectedRecordsMap.delete(e.detail);
        if (this.recentlyViewedRecords.length > 0 && this.recentlyViewedEmpty) {this.recentlyViewedEmpty = false;}
    }

    /**
     * @method handleSave
     * @description saves the selected records by calling an Apex Method
     * */

    handleSave(e) {
        saveRecord({selectedRecords: this.selectedRecords, recordId: this.recordId, CHILD_OBJECT_API: this.CHILD_OBJECT_API, CHILD_OBJECT_NAME_API: this.CHILD_OBJECT_NAME_API, LOOKUP_TO_PARENT_API: this.LOOKUP_TO_PARENT_API})
            .then(result => {
                let event;
                if(result === 'success') {
                    event = new ShowToastEvent({
                        title: 'Success!',
                        variant: result,
                        message: 'Your records have successfully been updated',
                    });
                }
                this.modified = false;
                this.dispatchEvent(event);
        })
            .catch(error => {
                const event = new ShowToastEvent({
                    title: 'ERROR: ' + error.body.pageErrors[0].statusCode.replace('_', ' ') || 'Error',
                    variant: 'error',
                    message: error.body.pageErrors[0].message || 'An error has occurred',
                });
                this.modified = true;
                this.dispatchEvent(event);
            });

    }
    /**
     * @method handleFocusIn
     * @description displays recentlyViewed records or object records depending on if there is a value entered in the user input
     * */
    handleFocusIn(e){
        if (this.searchTerm) {this.displayRecords = true;}
        else {
            this.queryForRecentlyViewed();
            }
    }
    /**
     * @method handleFocusOut
     * @description sets the display records flags to false when focus is clicked off of the input
     * */
    handleFocusOut(e){
        this.displayRecentlyViewed = false;
        this.displayRecords = false;
    }
    keepFocusOn(e) {
        e.preventDefault();
        this.displayRecentlyViewed = true;
    }
    handleRelatedListRedirect(e) {
        console.log('hello');
        e.preventDefault();
        e.stopPropagation();
        this[NavigationMixin.Navigate](this.objectRelatedPageReference);
    }
}