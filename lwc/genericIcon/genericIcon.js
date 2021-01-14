import {LightningElement, api, wire,track} from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';


export default class GenericIcon extends LightningElement {
    @track iconUrl;
    @track iconColor;
    @api objectApi;

    @wire(getObjectInfo, {objectApiName: '$objectApi'})
    handleResult({error, data}) {
        if(data) {
            this.iconUrl = data.themeInfo.iconUrl;
            this.iconColor = data.themeInfo.color;
        }
        if(error) {
            console.log('error');
            console.log(error);
        }
    }

    get styleString(){
        return `background-color:#${this.iconColor};border-radius:0.25rem;`
    }

}