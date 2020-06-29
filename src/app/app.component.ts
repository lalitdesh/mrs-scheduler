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
import { format, addHours, addMinutes, differenceInHours } from 'date-fns';
import { NgxSpinnerService } from 'ngx-spinner';

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

  // technicianListArray: Array<any> = [

  //   {
  //   "empId": "100",
  //   "empName": "Mac Roger",
  //   "profileImage": "1580920456.jpg",
  //   "absent": null,
  //   "eventCount": 1,
  //   "eventdata": [
  //       {
  //       "eventId": "736",
  //       "tenantName": "TA HQ",
  //       "startDate": "2020-06-13 10:30",
  //       "endDate": "2020-06-13 11:30",
  //       "sostatus": "Open"
  //       },
  //       {
  //         "eventId": "736",
  //         "tenantName": "TA HQ",
  //         "startDate": "2020-06-13 09:30",
  //         "endDate": "2020-06-13 11:00",
  //         "sostatus": "Open"
  //         }

  //   ]
  //   },
  //   {
  //     "empId": "101",
  //     "empName": "Test",
  //     "profileImage": "1580920456.jpg",
  //     "absent": "present",
  //     "eventCount": 1,
  //     "eventdata": [
  //         {
  //         "eventId": "736",
  //         "tenantName": "TA HQ",
  //         "startDate": "2020-06-13 02:30",
  //         "endDate": "2020-06-13 03:30",
  //         "sostatus": "Open"
  //         },

  //     ]
  //     }

  // ]
  eventPopupTitle: string = 'Add New Event';
  technicianListArray: Array<any> = [];
  orderListArray: Array<any> = [];
  tenantArray: Array<any> = [];
  selectedEvent: Array<any> = [];
  addEventForm: FormGroup;
  startDate: Date = new Date();
  endDate: Date = addHours(new Date(), 2);
  isDeleteButtonVisible: boolean = false;
  eventFormArray: IEventFormFields = {
    service_order: '',
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

  formStartDate: Date = new Date();
  formStartTime: Date = new Date();
  minFormEndDate: Date = addHours(new Date(), 2);

  date: Date = new Date();
  zoomInZoomOutArray: Array<any> = [
    { id: 3, value: 'Hour', defualt: true, cal: 'resourceTimelineDay' },
    { id: 4, value: 'Week', defualt: false, cal: 'resourceTimelineWeek' },
    { id: 5, value: 'Month', defualt: false, cal: 'resourceTimelineMonth' },
    { id: 6, value: 'Year', defualt: false, cal: 'resourceTimelineYear' },
  ];
  calendarIndexArray: Array<any> = []; //defualt is hour
  zoomIn: number = this.zoomInZoomOutArray.indexOf('hour') - 1;
  zoomOut: number = this.zoomInZoomOutArray.indexOf('hour') + 1;

  constructor(
    private service: AppService,
    @Inject(DOCUMENT) private document: any,
    private spinner: NgxSpinnerService,
    private formBuilder: FormBuilder
  ) {}
  /**
   * Component initialized
   */
  ngOnInit(): void {
    console.log(this.eventFormArray);
    this.zoomInZoomOutArray.forEach((elment, index) => {
      if (elment.defualt == true) {
        this.zoomIn = index - 1;
        this.zoomOut = index + 1;
        this.calendarIndexArray = elment;
      }
    });
    this.form();
    this.getTechnicians();
    this.getOrderStatus();
    this.getTenant();
    this.elem = document.documentElement;
  }
  /**
   *
   * @param string type
   * @param number value
   */
  onChangeZoomInZoomOut(type, value) {
    this.zoomOut = value + 1;
    this.zoomIn = value - 1;
    console.log(this.zoomInZoomOutArray[value]);
    this.calendarIndexArray = this.zoomInZoomOutArray[value];
    this.zoomInZoomOutArray[value].defualt = true;
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
  }
  /**
   * Get technician list
   */
  getTechnicians(): void {
    this.spinner.show();
    this.getEventSubscription = this.service
      .getTechniciansList()
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
        console.log('orderListArray', this.orderListArray);
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
        console.log('tenantArray', this.tenantArray);
      });
  }
  /**
   * Initialize the add event form
   */
  form(): void {
    this.addEventForm = new FormGroup({
      task_name: new FormControl(this.eventFormArray.task_name, [
        Validators.required,
      ]),
      service_order: new FormControl(this.eventFormArray.service_order, [
        Validators.required,
      ]),
      emp_id: new FormControl(this.eventFormArray.emp_id),
      eventId: new FormControl(this.eventFormArray.eventId),
      status: new FormControl(this.eventFormArray.status),
      start_date: new FormControl(new Date()),
      end_date: new FormControl(addHours(new Date(), 2)),
      start_time: new FormControl(new Date()),
      end_time: new FormControl(addHours(new Date(), 2)),
    });
  }
  get f() {
    return this.addEventForm.controls;
  }

  /**
   * Save event
   * @param formvalues IEventFormFields
   */
  addEvent(): void {
    console.log(this.addEventForm.value);
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
      return;
    }

    const formarray: IEventFormRequest = {
      taskName: `${formvalues.service_order} ${formvalues.task_name}`,
      startDate: `${startDate} ${startTime}`,
      endDate: `${endDate} ${endTime}`,
      empId: formvalues.emp_id,
      eventId: formvalues.eventId,
      status: formvalues.status,
    };
    this.addEventSubscription = this.service
      .addEvent(formarray)
      .subscribe((response: any) => {
        if (response.status == 1) {
          this.getTechnicians();
          let message = 'Event Added Succefully';
          if (this.isDeleteButtonVisible) {
            message = 'Event Updated Succefully';
          }
          this.closeAddEventModalPopup();

          this.service.toastMessage(1, message); //success
          this.spinner.hide();
          window.location.reload();
        } else {
          this.service.toastMessage(0, 'Something Went Wrong'); //error
          this.spinner.hide();
        }
      });
  }
  openModal() {
    // this.form()
    this.formSumbited = false;

    this.addEventModal.show();
  }
  closeAddEventModalPopup() {
    this.resetSelectedEvent = !this.resetSelectedEvent;
    this.formSumbited = false;

    console.log('resetSelectedEvent');
    this.addEventModal.hide();
    this.addEventForm.reset();
    this.eventFormArray = {
      service_order: '',
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
    this.eventPopupTitle = 'Add New Event';
    this.isDeleteButtonVisible = false;
    this.formStartDate = new Date();
    this.formStartTime = new Date();
    this.minFormEndDate = addHours(new Date(), 2);
  }

  /**
   * get event details from calendar
   */
  onEventSelect($event): void {
    console.log('onEventSelect----', $event);
    this.formSumbited = false;

    this.eventFormArray = {
      service_order: '',
      task_name: '',
      emp_id: $event.id,
      eventId: this.tenantArray[0].id,
      status: this.orderListArray[0].id,
      start_date: $event.startDate,
      end_date: $event.endDate,
      start_time: $event.startDate,
      end_time: $event.endDate,
    };
    console.log('onEventSelect eventFormArray', this.eventFormArray);

    this.addEventForm.patchValue(this.eventFormArray);
    console.log(this.eventFormArray);
    this.addEventModal.show();
  }

  fullScreen(value: boolean) {
    console.log(value);
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
    console.log('resizedddd', $event);
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
    this.addEventSubscription = this.service
      .addEvent(formarray)
      .subscribe((response: any) => {});
  }
  onEventUpdate($event): void {
    console.log('onEv', $event);
    this.selectedEvent = $event;
    this.eventPopupTitle = 'Edit Event';
    this.isDeleteButtonVisible = true;
    this.eventFormArray = {
      service_order: $event.taskName.substr(0, $event.taskName.indexOf(' ')),
      task_name: $event.taskName.substr($event.taskName.indexOf(' ') + 1),
      emp_id: $event.empId,
      eventId: $event.eventId,
      status: $event.statusId,
      start_date: new Date($event.startDate),
      end_date: new Date($event.endDate),
      start_time: new Date($event.startDate),
      end_time: new Date($event.endDate),
    };
    this.formStartDate = new Date($event.startDate);
    this.formStartTime = new Date($event.startDate);
    // this.minFormEndDate = addHours(new Date(), 2);

    this.addEventForm.patchValue(this.eventFormArray);
    this.addEventModal.show();
  }
  ondragDropEvent($event): void {
    console.log('as', $event);
    // return;
    this.spinner.show();
    this.addEventSubscription = this.service
      .addEvent($event)
      .subscribe((response: any) => {
        if (response.status == 1) {
          this.getTechnicians();
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
    this.spinner.show()
    this.service
      .deleteEvent(id)
      .subscribe((response: any) => {
        // debugger;
        this.spinner.hide()

        if (response.status == 1) {
          this.getTechnicians();
          this.service.toastMessage(1, "Event Deleted Succefully")
          this.closeAddEventModalPopup();
          window.location.reload(true)
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
    this.date = $event;
  }
  onStartDateChange($event) {
    console.log('onStartDateChange', $event);
    if ($event != null) {
      this.formStartDate = $event;
      const startDate = format($event, 'MM/dd/yyyy');
      const startTime = format(this.formStartTime, 'hh:mm a');
      this.minFormEndDate = addHours(new Date(`${startDate} ${startTime}`), 2);
    }
  }
  onStartTimeChange($event) {
    console.log('onStartTimeChange', $event);
    if ($event != null) {
      this.formStartTime = $event;
      const startDate = format(this.formStartDate, 'MM/dd/yyyy');
      const startTime = format($event, 'hh:mm a');
      this.minFormEndDate = addHours(new Date(`${startDate} ${startTime}`), 2);
    }
  }
  /**
   * function for re-intialize
   */
  reoladDatabase() {
    // this.form();
    this.getTechnicians();
    this.getTenant();
    this.closeAddEventModalPopup();
  }
}
