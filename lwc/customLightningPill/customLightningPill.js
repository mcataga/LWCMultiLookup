import {LightningElement, api , track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class CustomLightningPill extends NavigationMixin(LightningElement) {
    /**
     * @var objectRecord
     * @type Object
     * @description object from the Parent component */
    @api objectRecord;
    /**
     * @var objectRecord
     * @type String
     * @description Child object API Name from the Parent component used for the icon in the front end */
    @api objectApi;
    /**
     * @var url
     * @type String
     * @description url for the record */
    @track url;

    /**
     * @method renderedCallback
     * @description generates the url used in the frontend */

    renderedCallback() {
        this.objectRecordPageReference = {
            type: 'standard__recordPage',
            attributes: {
                recordId: this.objectRecord.Id,
                actionName: 'view'
            }
        };
        this[NavigationMixin.GenerateUrl](this.objectRecordPageReference)
            .then(url => {
                this.url = url;
            });
    }
    /**
     * @method navigateToRecordViewPage
     * @description creates a subtab under the current record when called */
    navigateToRecordViewPage(event) {
        event.preventDefault();
        event.stopPropagation();
        this[NavigationMixin.Navigate](this.objectRecordPageReference)
    }
    /**
     * @method sendEventToParent
     * @description sends the Id of the current pill to the parent component so that it can be removed */
    sendEventToParent(e) {
        const selectedEvent = new CustomEvent("deleteselecteditem", {
            detail: this.objectRecord.Id
        });
        this.dispatchEvent(selectedEvent);
    }

}