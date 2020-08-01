import {
  Component,
  ViewChild,
  TemplateRef,
  OnInit,
  OnDestroy,
  Inject,
  ViewEncapsulation,
} from '@angular/core';
import { AppService } from './app.service';

import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import {
  BsModalService,
  BsModalRef,
  ModalDirective,
} from 'ngx-bootstrap/modal';
import { IEventFormFields, IEventFormRequest } from './interfaces/app';
import { Subscription } from 'rxjs';
import { format, addHours, addMinutes,startOfWeek,addDays, differenceInHours, addYears,startOfYear, startOfMonth, addMonths } from 'date-fns';
import { NgxSpinnerService } from 'ngx-spinner';
import * as $ from 'jquery';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';  
import { Observable } from 'rxjs';

@Component({
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  config = {
    animated: false,
    backdrop: 'static',
    keyboard: false,
  };
  @ViewChild('addEventModal') addEventModal: ModalDirective;
  title = 'calendarModule';
  elem;
  fullScreenWindow: boolean = false;
  xInitial = '50%!important;';
  yInitial = '50%!important;';
  selectedValue: string;  
  selectedOption: any;  
  serviceOrderArray: any=[]; 
  eventPopupTitle: string = 'Schedule Service Order';
  technicianListArray: Array<any> = [];
  orderListArray: Array<any> = [];
  tenantArray: Array<any> = [];
  selectedEvent: Array<any> = [];
  addEventForm: FormGroup;
  startDate: Date = new Date();
  endDate: Date = addHours(new Date(), 2);
  isDeleteButtonVisible: boolean = false;
  eventFormArray: IEventFormFields = {
    // service_order: '',
    task_name: '',
    emp_id: null,
    eventId: null,
    status: null,
    start_date: this.startDate,
    end_date: addHours(new Date(), 2),
    start_time: this.startDate,
    end_time: addHours(new Date(), 2),
  };
  // initialize subscriptions
  getEventSubscription: Subscription;
  addEventSubscription: Subscription;
  orderStatusSubscription: Subscription;
  tenantSubscription: Subscription;
  resetSelectedEvent: boolean = false;
  formSumbited: boolean = false;
  date:Date=new Date();;
  formStartTime: string;
  formEndTime: string;
  typeaheadNoResults: boolean;

  // formStartTime: Date = new Date();
  minFormEndDate: Date = addHours(new Date(), 2);
  bsInlineRangeValue: Date[];

  // date: Date = new Date();
  zoomInZoomOutArray: Array<any> = [
    { id: 3, value: 'Hour', defualt: true, cal: 'resourceTimelineDay' },
    { id: 4, value: 'Week', defualt: false, cal: 'resourceTimelineWeek' },
    { id: 8, value: 'Week2', defualt: false, cal: 'resourceTimelineWeek2' },
    { id: 5, value: 'Month', defualt: false, cal: 'resourceTimelineMonth' },
    { id: 6, value: 'Year', defualt: false, cal: 'resourceTimelineYear' },
    { id: 7, value: 'Year2', defualt: false, cal: 'resourceTimelineYear2' },


  ];
  calendarIndexArray: Array<any> = []; //defualt is hour
  zoomIn: number = this.zoomInZoomOutArray.indexOf('hour') - 1;
  zoomOut: number = this.zoomInZoomOutArray.indexOf('hour') + 1;

  constructor(
    private service: AppService,
    @Inject(DOCUMENT) private document: any,
    private spinner: NgxSpinnerService,
    private formBuilder: FormBuilder
  ) { }

   
  /**
   * Component initialized
   */
  ngOnInit(): void {

    

    this.bsInlineRangeValue = [new Date(),addHours(new Date(), 24)];
    this.zoomInZoomOutArray.forEach((elment, index) => {
      if (elment.defualt == true) {
        this.zoomIn = index - 1;
        this.zoomOut = index + 1;
        this.calendarIndexArray = elment;
      }
    });
    this.form();
    this.getTechnicians(this.bsInlineRangeValue);
    this.getOrderStatus();
    this.getTenant();
    this.elem = document.documentElement;
    let thats=this;


    (<any>window).$('.datetimepickerStart').datetimepicker(
      {  format: 'LT', defaultDate: thats.startDate, useCurrent: false }).on('dp.change', function (e) { 
        // console.log(`e.date.format('lll')`, e.date, e.date.format('lll'), new Date(), new Date(e.date.format('lll')));
        thats.addEventForm.patchValue({
        start_time: new Date(e.date.format('lll')),
      });
    });

    (<any>window).$('.datetimepickerEnd').datetimepicker(
      {  format: 'LT', defaultDate: thats.endDate, useCurrent: false }).on('dp.change', function (e) { 
        thats.addEventForm.patchValue({
        end_time: new Date(e.date.format('lll')),
      });
    });
  }
  /**
   *
   * @param string type
   * @param number value
   */
  onChangeZoomInZoomOut(type, value) {
    this.zoomOut = value + 1;
    this.zoomIn = value - 1;
    this.calendarIndexArray = this.zoomInZoomOutArray[value];

    this.zoomInZoomOutArray.forEach( (option) => {
      option.defualt = false;
    });

    this.zoomInZoomOutArray[value].defualt = true;
    this.getTechnicianWithRange(this.zoomInZoomOutArray[value].id)
  }

  getServiceOrder($event){

    if(!$event){
      this.serviceOrderArray.length=0;
      this.addEventForm.patchValue({
        task_name: "",
      });
      return false;
    }
     this.service
      .serviceOredrNameWithReason($event)
      .subscribe((response: any) => {
        // console.log("response",response);
        this.serviceOrderArray.length=0;
        if (response.status != 0 ) {
          this.serviceOrderArray=response;
        }
      });
  } 
  changeTypeaheadNoResults($event){
    if($event == true){
      this.addEventForm.patchValue({
        task_name: "",
        eventId:this.tenantArray[0].id
      });
    }
    this.typeaheadNoResults=$event;

  }
  onSelectServiceOrder(event: TypeaheadMatch): void {  
    const index = this.tenantArray.findIndex((x) => x.id == event.item.id);
    let eventId = this.tenantArray[0].id;
    if(index != -1){
      eventId = this.tenantArray[index].id;
    }

    this.addEventForm.patchValue({
      task_name: `${event.item.value} ${event.item.reason}` ,
      eventId:eventId ,
    });
  }  
  /**
   *
   * @param number value
   */
  onCalendarSelectChage(value) {
    value = parseInt(value);
    const index = this.zoomInZoomOutArray.findIndex((x) => x.id === value);
    this.zoomIn = index - 1;
    this.zoomOut = index + 1;
    this.calendarIndexArray = this.zoomInZoomOutArray[index];
    this.zoomInZoomOutArray[index].defualt = true;
    this.getTechnicianWithRange(this.zoomInZoomOutArray[index].id)
  }
  getTechnicianWithRange(condtion:number){
    switch (condtion) {
      case 3:
        this.date=new Date();

        this.bsInlineRangeValue = [this.date,addDays(this.date, 1)];
        this.getTechnicians(this.bsInlineRangeValue)

      break;
      case 4:
        this.date=new Date();

        this.bsInlineRangeValue = [startOfWeek(this.date),addDays(startOfWeek(this.date), 8)];
        this.getTechnicians(this.bsInlineRangeValue)

        break;
      case 5: {
        this.date=new Date();

        this.bsInlineRangeValue = [startOfMonth(this.date),addMonths(startOfMonth(this.date), 1)];
        this.getTechnicians(this.bsInlineRangeValue)
        
        break;
      }
      case 6:{
        this.date=new Date();

        this.bsInlineRangeValue = [startOfYear(this.date),addYears(startOfYear(this.date), 1)];
        this.getTechnicians(this.bsInlineRangeValue)
        break;
      }
      case 7:{
        // this.bsInlineRangeValue = [addYears(startOfYear(this.date), -1),addYears(startOfYear(this.date), 1)];
        this.bsInlineRangeValue = [addYears(startOfYear(this.date), 0),addYears(startOfYear(this.date), +2)];
        this.getTechnicians(this.bsInlineRangeValue)
        this.date=addYears(startOfYear(this.date), 0);

        break;
        
      }
      case 8:{
        this.date=new Date();
        this.bsInlineRangeValue = [startOfWeek(this.date),addDays(startOfWeek(this.date), 16)];
        this.getTechnicians(this.bsInlineRangeValue)
        break;
        
      }
        /** year */
       

        break;
    }
  }
  /**
   * Get technician list
   */
  getTechnicians(date:any): void {
    this.spinner.show();
    this.getEventSubscription = this.service
      .getTechniciansList(date)
      .subscribe((response: any) => {
        if (response.status === 1) {
          this.technicianListArray = response.data;
          this.addEventForm.patchValue({
            emp_id: this.technicianListArray[0].empId,
          });
          this.technicianListArray = this.technicianListArray.splice(0, 15);
        }
        this.spinner.hide();
      });
  }
  /**
   * Get order status list
   */
  getOrderStatus(): void {
    this.orderStatusSubscription = this.service
      .getOrderStatus()
      .subscribe((response: any) => {
        if (response.status == 1) {
          this.orderListArray = response.data;
          this.addEventForm.patchValue({
            status: response.data[0].id,
          });
        }
      });
  }
  /**
   * Get order status list
   */
  getTenant(): void {
    this.tenantSubscription = this.service
      .getTenant()
      .subscribe((response: any) => {
        if (response.status == 1) {
          this.tenantArray = response.data;
          this.addEventForm.patchValue({
            eventId: response.data[0].id,
          });
          }
      });
  }
  /**
   * Initialize the add event form
   */
  form(): void {
    const currentDate=new Date();
    const endDate=addHours(currentDate, 2);
    this.formStartTime = `${currentDate.getHours()}:${currentDate.getMinutes()}`;
    this.formEndTime = `${endDate.getHours()} : ${endDate.getMinutes()}`;
    this.addEventForm = new FormGroup({
      task_name: new FormControl(this.eventFormArray.task_name, [
        Validators.required,
      ]),


      // service_order: new FormControl(this.eventFormArray.service_order, [
      //   Validators.required,
      // ]),
      emp_id: new FormControl(this.eventFormArray.emp_id),
      eventId: new FormControl(this.eventFormArray.eventId),
      status: new FormControl(this.eventFormArray.status),
      start_date: new FormControl(currentDate),
      end_date: new FormControl(endDate),
      start_time: new FormControl(currentDate),
      end_time: new FormControl(endDate),
    });
    setTimeout(() => {
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox

    }, 0);
   
    


  }
  get f() {
    return this.addEventForm.controls;
  }
 
  /**
   * Save event
   * @param formvalues IEventFormFields
   */
  addEvent(): void {
    // console.log("this.addEventForm.value",this.addEventForm.value)
    // console.log("this.formStartTime",this.formStartTime)
    // return;
    this.formSumbited = true;
    if (this.addEventForm.invalid) {
      return;
    }

    const formvalues = this.addEventForm.value;
    const startDate = format(formvalues.start_date, 'MM/dd/yyyy');
    const startTime = format(formvalues.start_time, 'hh:mm a');
    const endDate = format(formvalues.end_date, 'MM/dd/yyyy');
    const endTime = format(formvalues.end_time, 'hh:mm a');
    const diff = differenceInHours(
      new Date(`${endDate} ${endTime}`),
      new Date(`${startDate} ${startTime}`)
    );

    if (diff < 2) {
      this.service.toastMessage(0, 'Event must be two hours');
      this.formSumbited = false;
      return;
    }
    
    const formarray: IEventFormRequest = {
      taskName: `${formvalues.task_name}`,
      startDate: `${startDate} ${startTime}`,
      endDate: `${endDate} ${endTime}`,
      empId: formvalues.emp_id,
      eventId: formvalues.eventId,
      status: formvalues.status,
    };

    this.spinner.show()
    this.addEventSubscription = this.service
      .addEvent(formarray)
      .subscribe((response: any) => {
        this.formSumbited = false;
        if (response.status == 1) {
          this.getTechnicians(this.bsInlineRangeValue);
          let message = 'Event Added Succefully';
          if (this.isDeleteButtonVisible) {
            message = 'Event Updated Succefully';
          }
          this.closeAddEventModalPopup();

          this.service.toastMessage(1, message); //success
          this.spinner.hide();
          // window.location.reload();
        } else {
          this.service.toastMessage(0, 'Something Went Wrong'); //error
          this.spinner.hide();
        }
      });
  }
  openModal(tech?) {
    const currentDate=new Date();
    const endDate=addHours(currentDate, 2);
    this.formStartTime = `${currentDate.getHours()}:${currentDate.getMinutes()}`;
    this.formEndTime = `${endDate.getHours()} : ${endDate.getMinutes()}`;
    if (tech && tech.id) {
      this.addEventForm.patchValue({ emp_id: tech.id,
                              start_time: this.formStartTime,
                              end_time: this.formEndTime });
                                  
    }
    setTimeout(() => {
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox

    }, 0);
   
    this.formSumbited = false;
    // this.form();
    this.addEventModal.show();
  }
  closeAddEventModalPopup() {
    this.resetSelectedEvent = !this.resetSelectedEvent;
    this.formSumbited = false;
    this.typeaheadNoResults=false;
    this.addEventModal.hide();
    this.addEventForm.reset();
    this.eventFormArray = {
      // service_order: '',
      task_name: '',
      emp_id: this.technicianListArray[0].empId,
      eventId: this.tenantArray[0].id,
      status: this.orderListArray[0].id,
      start_date: new Date(),
      end_date: addHours(new Date(), 2),
      start_time: new Date(),
      end_time: addHours(new Date(), 2),
    };
    this.addEventForm.patchValue(this.eventFormArray);
    this.eventPopupTitle = 'Schedule Service Order';
    this.isDeleteButtonVisible = false;
    // this.formStartTime = "";
    // this.formStartTime = new Date();
    this.minFormEndDate = addHours(new Date(), 2);
  }

  /**
   * get event details from calendar
   */
  onEventSelect($event): void {
    this.formSumbited = false;
    this.eventFormArray = {
      // service_order: '',
      task_name: '',
      emp_id: $event.id,
      eventId: this.tenantArray[0].id,
      status: this.orderListArray[0].id,
      start_date: $event.startDate,
      end_date: $event.endDate,
      start_time: $event.startDate,
      end_time: $event.endDate,
    };

    this.addEventForm.reset();
    this.addEventForm.patchValue(this.eventFormArray);
    this.formStartTime = `${new Date($event.startDate).getHours()} : ${new Date($event.startDate).getMinutes()}`;
    this.formEndTime = `${new Date($event.endDate).getHours()} : ${new Date($event.endDate).getMinutes()}`;

    setTimeout(() => {
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox

    }, 0);

    this.addEventModal.show();
  }

  fullScreen(value: boolean) {
    if (!value) {
      this.fullScreenWindow = true;
      if (this.elem.requestFullscreen) {
        this.elem.requestFullscreen();
      } else if (this.elem.mozRequestFullScreen) {
        /* Firefox */
        this.elem.mozRequestFullScreen();
      } else if (this.elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.elem.webkitRequestFullscreen();
      } else if (this.elem.msRequestFullscreen) {
        /* IE/Edge */
        this.elem.msRequestFullscreen();
      }
    } else {
      this.fullScreenWindow = false;

      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
    }
  }

  /**
   * clear all subscription on component destroy
   *
   *
   */
  ngOnDestroy(): void {
    // clear get event subscrition
    if (this.getEventSubscription) {
      this.getEventSubscription.unsubscribe();
    }
    // clear add event subscrition
    if (this.addEventSubscription) {
      this.addEventSubscription.unsubscribe();
    }
    // clear add event subscrition
    if (this.orderStatusSubscription) {
      this.orderStatusSubscription.unsubscribe();
    }
  }
  /**
   * function for when user change date rage by resizable
   * @param $event full event data
   */
  onEventDateChange($event): void {
    const startDate = format($event.startDate, 'MM/dd/yyyy');
    const startTime = format($event.startDate, 'hh:mm a');
    const endDate = format($event.endDate, 'MM/dd/yyyy');
    const endTime = format($event.endDate, 'hh:mm a');

    // let startFullDate = $event.startDate + " ";//converted into string
    // let endFullDate = $event.endDate + " ";
    // tslint:disable-next-line:max-line-length
    // const startDate = startFullDate.includes("-") ? $event.startDate : format($event.startDate, 'MM/dd/yyyy') + " " + format($event.startDate, 'hh:mm a');
    // tslint:disable-next-line:max-line-length
    // const endDate = endFullDate.includes("-") ? $event.endDate : format($event.endDate, 'MM/dd/yyyy') + " " + format($event.endDate, 'hh:mm a');
    const formarray: IEventFormRequest = {
      taskName: $event.taskName,
      startDate: `${startDate} ${startTime}`,
      endDate: `${endDate} ${endTime}`,
      empId: $event.empId,
      eventId: $event.eventId,
      status: $event.statusId,
    };
    // console.log("formarray,onEventDateChange",formarray)
    // return;
    this.spinner.show();
    this.addEventSubscription = this.service
      .addEvent(formarray)
      .subscribe((response: any) => {
        if (response.status == 1) {
          this.service.toastMessage(1, "Event Updated Succefully"); //success
          this.spinner.hide();
        } else {
          this.service.toastMessage(0, 'Something Went Wrong'); //error
          this.spinner.hide();
        }

       });

       
  }
  onEventUpdate($event): void {
    this.selectedEvent = $event;
    this.eventPopupTitle = 'Edit Schedule Service Order';
    this.isDeleteButtonVisible = true;
    this.typeaheadNoResults=false;
    this.eventFormArray = {
      // service_order: $event.taskName.substr(0, $event.taskName.indexOf(' ')),
      task_name: $event.taskName,
      emp_id: $event.empId,
      eventId: $event.eventId,
      status: $event.statusId,
      start_date: new Date($event.startDate),
      end_date: new Date($event.endDate),
      start_time: new Date($event.startDate),
      end_time: new Date($event.endDate),
    };
    this.formStartTime = `${new Date($event.startDate).getHours()} : ${new Date($event.startDate).getMinutes()}`;
    this.formEndTime = `${new Date($event.endDate).getHours()} : ${new Date($event.endDate).getMinutes()}`;
    this.addEventForm.reset();
    this.addEventForm.patchValue(this.eventFormArray);
    this.addEventModal.show();
    setTimeout(() => {
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericon").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox
      $(".timepickericonEnd").click(); // Click on the checkbox

    }, 0);
  }
  ondragDropEvent($event): void {
    // return;
    this.spinner.show();
    this.addEventSubscription = this.service
      .addEvent($event)
      .subscribe((response: any) => {
        if (response.status == 1) {
          this.getTechnicians(this.bsInlineRangeValue);
          this.service.toastMessage(1, "Event Updated Succefully"); //success

        } else {
          this.service.toastMessage(0, 'Something Went Wrong'); //error
          this.spinner.hide();
        }
      });
  }
  /**
   * Function for delete event
   * @param number id
   */
  deleteEvent(id) {

    // console.log("id",id);
    // return;
    this.spinner.show()
    this.service
      .deleteEvent(id)
      .subscribe((response: any) => {
        // debugger;
        this.spinner.hide()

        if (response.status == 1) {
          this.getTechnicians(this.bsInlineRangeValue);
          this.service.toastMessage(1, "Event Deleted Succefully")
          this.closeAddEventModalPopup();
          // window.location.reload(true)
        } else {
          this.service.toastMessage(1, "Something went wrong")
        }
      });
  }
  /**
   * Date change function from header
   * @param $event
   */
  onDateChange($event) {
    this.date=$event;
    this.bsInlineRangeValue=[$event,addHours(new Date($event),24)];

    this.getTechnicians(this.bsInlineRangeValue)
    
    // this.date = $event;
  }
  onStartDateChange($event) {
    // if ($event != null) {
      // this.formStartDate = $event;
      // const startDate = format($event, 'MM/dd/yyyy');
      // const startTime = format(this.formStartTime, 'hh:mm a');
      // this.minFormEndDate = addHours(new Date(`${startDate} ${startTime}`), 2);
    // }
  }
  onStartTimeChange($event) {
    if ($event != null) {
      // this.formStartTime = $event;
      // const startDate = format(this.formStartDate, 'MM/dd/yyyy');
      // const startTime = format($event, 'hh:mm a');
      // this.minFormEndDate = addHours(new Date(`${startDate} ${startTime}`), 2);
    }
  }
  /**
   * function for re-intialize
   */
  reoladDatabase() {
    // this.form();
    this.getTechnicians(this.bsInlineRangeValue);
    this.getTenant();
    this.closeAddEventModalPopup();
  }
}
