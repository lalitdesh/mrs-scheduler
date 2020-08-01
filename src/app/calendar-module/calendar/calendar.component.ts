import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import setHours from 'date-fns/setHours';
import isEqual from 'date-fns/isEqual';
import isSameDay from 'date-fns/isSameDay';
import compareAsc from 'date-fns/compareAsc';
import { ContextMenuComponent } from 'ngx-contextmenu';
import {
  startOfMonth,
  lastDayOfMonth,
  differenceInDays,
  addDays,
  startOfYear,
} from 'date-fns';

import { Subscription, fromEvent } from 'rxjs';
import { flatMap, takeUntil } from 'rxjs/operators';
import isSameHour from 'date-fns/isSameHour';
import setMinutes from 'date-fns/setMinutes';
import isSameWeek from 'date-fns/isSameWeek';
import addYears from 'date-fns/addYears';
import addMonths from 'date-fns/addMonths';
import add from 'date-fns/add';
import { addHours, addMinutes, format } from 'date-fns';
import * as $ from 'jquery'; // import Jquery here
import { CalendarComponent } from 'ng-fullcalendar';
import interactionPlugin from '@fullcalendar/interaction';

import { Calendar, OptionsInput } from '@fullcalendar/core';

import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import timeline from '@fullcalendar/timeline';
import { element } from 'protractor';
import { ContextMenuService } from 'ngx-contextmenu';
import { el } from 'date-fns/locale';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponents implements OnInit, OnChanges, AfterViewChecked {
  @Input() public techniciansArray: Array<any> = [];
  @Input() public resetSelectedEvent;
  @Input() public calendarIndex: Array<any> = [];
  @Input() public date: Date = new Date();
  @Output() eventSelect = new EventEmitter();
  @Output() eventDateChange = new EventEmitter();
  @Output() eventUpdate = new EventEmitter();
  @Output() addEventPopup = new EventEmitter();
  @Output() dragEvent = new EventEmitter();
  @Output() eventDelete = new EventEmitter();

  S3BucketUrl: string = 'https://s3.amazonaws.com/myroofbucket/users/';
  subs = new Subscription();
  rightBlockTechniciansList: Array<object> = [];

  resources: Array<object> = [];
  events: Array<object> = [];
  allEvents: Array<any> = [];

  @ViewChild(ContextMenuComponent) public addEventMenu: ContextMenuComponent;
  @ViewChild(ContextMenuComponent) public OnEventClick: ContextMenuComponent;

  calendarDates: any;
  selectedEventData: any = null;
  randomColor = '';
  isResizingEvent: boolean = false;
  Math: any;
  calendarHeadingFormat: string;
  calendarSubHeadingFormat: string;
  calendarViewOption: number;
  jsonVar = JSON;
  elem;

  dateTimeRow = [];
  dateTimeRowWidth = 0;

  yearHeading = [];

  quarterYear = ['Q1', 'Q2', 'Q3', 'Q4'];
  options: OptionsInput;
  calendarEl = document.getElementById('calendar');

  eventsModel: any;
  @ViewChild('fullcalendar') fullcalendar: CalendarComponent;

  techniciansById = {};
  addEventTechId: any;
  editEventObj: any;
  contextEventId: number;
  isDateClick: boolean = false;

  constructor(private contextMenuService: ContextMenuService) {
    this.elem = document.documentElement;

    this.Math = Math;

  }
  ngAfterViewChecked(): void {
    this.setLefTColTechnicianHeight();
    // this.initFullcalendar()
  }
  ngOnChanges() {
    this.options = null;
    this.resources = [];
    this.events = [];
    this.allEvents=[];
  

    this.techniciansArray.forEach((tech) => {
      this.techniciansById[tech.empId] = tech;
    });

    if (this.techniciansArray.length > 0) {
      this.techniciansArray.forEach((element) => {
        this.resources.push({
          id: element.empId,
          title: element.empName,
        });
        if (element.eventCount > 0) {
          element.eventdata.forEach((element1) => {
            element1['empId']=element.empId;

            this.allEvents.push(element1);


            const icons = {
              Canceled: 'fa-times',
              Closed: 'fa-ban',
              Complete: 'fa-check-square-o',
              Dispatched: 'fa-truck',
              Incomplete: 'fa-circle-o-notch',
              'On Hold': 'fa-ban',
              Open: 'fa-circle-thin',
              'Pending Approval': 'fa-flag-o',
              Scheduled: 'fa-calendar-check-o',
              Started: 'fa-wrench',
              'Temporary Repair': 'fa-chain-broken',
            };
            this.events.push({
              id: element1.eventId,
              resourceId: element.empId,
              title: `<div class="event-show"> <div class="event-icon"> <i class="fa fa-lg fa-fw fa ${icons[element1.status]}"></i> </div> <div class="w-100"> ${element1.taskName}<br />${element1.tenantName}<br />${element1.status} <span class="float-right">${element1.priority}</span><div></div>`,
              start: new Date(element1.startDate),
              end: new Date(element1.endDate),
              customRender: true,
              taskName: element1.taskName,
              className: `status-${element1.statusId}`, //  override!
              popup: {
                title: element1.taskName,
                start: format(new Date(element1.startDate), 'MMM d, y hh:mm a'),
                end: format(new Date(element1.endDate), 'MMM d, y hh:mm a'),
                status: element1.status,
                tenantName: element1.tenantName,
                priority: element1.priority,

              },
            });
          });
        }
      });
      this.dateTimeRow = [];
      this.calendarViewOption = this.calendarIndex['id'];

      this.date.setHours(0);
      this.date.setMinutes(0);
      this.date.setSeconds(0);
      this.date.setMilliseconds(0);
      setTimeout(() => {
        this.initFullcalendar();
      }, 0 );
    }

    this.setCalendar();
    this.removeTempSelection();
    this.calendarHeadingFormat = 'E MM/dd';

    
  }
  initFullcalendar() {
    let that = this;
    this.options = {
      displayEventTime: false,
      editable: true, // don't allow event dragging
      selectable: true,
      // eventResourceEditable: true, // except for between resources
      droppable: true,
      // defaultDate: this.date,

      // aspectRatio: 1.605,
      height: window.innerHeight - 120,
      contentHeight: window.innerHeight - 120,
      handleWindowResize: true,
      eventTextColor: 'white',
      themeSystem: 'bootstrap3',
      plugins: [resourceTimelinePlugin, timeline, interactionPlugin],

      header: {
        // left: 'today prev,next',
        // center: 'title',
        right:
          'resourceTimelineDay,resourceTimelineWeek,resourceTimelineWeek2,resourceTimelineMonth,resourceTimelineYear,resourceTimelineYear2',
      },
      eventClick: (info) => {
        // alert('Event: ' + info.event);

        that.eventUpdates(info.event);
      },
      dateClick: (info) => {

        that.isDateClick = true;
      },
      select: (info) => {
        // alert(info.resource.id + 'selected ' + info.startStr + ' to ' + info.endStr);

        that.isDateClick = false;
        setTimeout(() => {
          that.eventSelects(info);
        });
      },
      eventDrop: (info: any) => {
        let resourceId;
        if (info.newResource) {
          resourceId = info.newResource.id;
        } else {
          const index = that.allEvents.findIndex(
            (x) => x['eventId'] === info.event.id
          );
          resourceId = that.allEvents[index].empId;
        }

        const techindex = that.techniciansArray.findIndex(
          (x) => x['empId'] === resourceId
        );
        if(this.techniciansArray[techindex].absent != null){
          info.revert();
          return;
        }

        that.eventDragStopF(info.event, resourceId);
      },
      eventResize: (info) => {
        that.eventDragResize(info.event);
      },
      views: {
        resourceTimelineYear2: {
          type: 'resourceTimelineYear',
          buttonText:"Year2",
          duration: {
           year:2
          },
         },
        resourceTimelineWeek2: {
          type: 'resourceTimelineWeek',
          buttonText:"Week2",
          duration: { weeks: 3 },
          slotDuration: {days: 1},
        }
      },


      defaultDate:new Date(this.date),

      



      // tslint:disable-next-line:no-string-literal
      defaultView: this.calendarIndex['cal'],
      resourceOrder: "title",
      // expandRows: true,
      resources: this.resources,
      events: this.events,
      resourceLabelText: 'Technician List',

      eventMouseEnter: function (info) {
        var tis = info.el;
        var popup = info.event.extendedProps.popup;
        var tooltip = '<div class="tooltipevent" style="top:' + ($(tis).offset().top - 5) + 'px;left:' + ($(tis).offset().left + ($(tis).width()) / 2) + 'px"><div>' + popup.title + '</div><div>' + popup.tenantName + '</div><div>' + popup.status + '</div><div>' + popup.priority + '</div></div>';
        var $tooltip = $(tooltip).appendTo('body');

        //            If you want to move the tooltip on mouse movement then you can uncomment it
        //            $(tis).mouseover(function(e) {
        //                $(tis).css('z-index', 10000);
        //                $tooltip.fadeIn('500');
        //                $tooltip.fadeTo('10', 1.9);
        //            }).mousemove(function(e) {
        //                $tooltip.css('top', e.pageY + 10);
        //                $tooltip.css('left', e.pageX + 20);
        //            });
      },
      eventMouseLeave: function (info) {
        $(info.el).css('z-index', 8);
        $('.tooltipevent').remove();
      },

      resourceRender: (resourceObj) => {
        const techObj = this.techniciansById[
          resourceObj.resource._resource.id
        ];
        let imgPath = techObj.profileImage
          ? `${this.S3BucketUrl}${techObj.profileImage}`
          : `../../../assets/images/profile.png`;

        let techHTML = `
            <div class="custom-cls">
              <div class="pro_pic">
                <img class="tech-profile-image" src="${imgPath}" />
                <img class="acti_notac" src="${
          !techObj.absent
            ? '../../../assets/images/active.png'
            : '../../../assets/images/in_active.png'
          }" />
              </div>
              <div>
                <div class="left-tech-name">${techObj.empName.ucWords()}</div>
                <div ><small>${techObj.eventCount || 0} Service Order</small></div>
              </div>
            </div>`;
        $(resourceObj.el).find('.fc-cell-content').html(techHTML);
      },


      // will be using it with tooltip js
      eventRender: (event: any) => {
        event.el.querySelectorAll('.fc-title')[0].innerHTML = event.el.querySelectorAll('.fc-title')[0].innerText;
        $(event.el).on('contextmenu', (e: any) => {
          this.contextEventId = event.event.extendedProps.popup.eventId;
          this.addEventTechId = null;
          this.editEventObj = {};

          this.contextMenuService.show.next({
            event: e.originalEvent,
            item: {},
          });

          e.preventDefault();
          e.stopPropagation();
        });
        return event.el;
      },

    };
  }

  ngOnInit(): void {
    // this.initFullcalendar();
  }
  eventUpdates(event: any) {
    const index = this.allEvents.findIndex((x) => x['eventId'] === event.id);
    this.eventUpdate.emit(this.allEvents[index]);
  }

  updateEvent(eventId: number) {
    const index = this.allEvents.findIndex((x) => x['eventId'] == eventId);


    this.eventUpdate.emit(this.allEvents[index]);
  }
  eventDragStopF(event: any, empId) {
    const index = this.allEvents.findIndex((x) => x['eventId'] === event.id);
    const startDate = format(event.start, 'MM/dd/yyyy');
    const startTime = format(event.start, 'hh:mm a');
    const endDate = format(event.end, 'MM/dd/yyyy');
    const endTime = format(event.end, 'hh:mm a');
    let obj = {
      eventId: event.id,
      taskName: event.extendedProps.taskName,
      empId: empId,
      startDate: `${startDate} ${startTime}`,
      endDate: `${endDate} ${endTime}`,
      status: this.allEvents[index].statusId,
    };
    this.dragEvent.emit(obj);
  }

  eventDragResize(event) {
    const index = this.allEvents.findIndex((x) => x['eventId'] === event.id);

    let obj = {
      eventId: event.id,
      taskName: event.extendedProps.taskName,
      empId: this.allEvents[index].empId,
      startDate: new Date(event.start.toISOString()),
      endDate: new Date(event.end.toISOString()),
      status: this.allEvents[index].status,
      statusId: this.allEvents[index].statusId,
    };
    this.eventDateChange.emit(obj);
  }

  setLefTColTechnicianHeight() {
    if(this.calendarIndex['id'] == 3 ){ // only runs in hours condtion
        this.techniciansArray.forEach((element) => {
          // console.log("element",element)
          if(element.absent != null){
            $('tr[data-resource-id="'+element.empId+'"]').addClass(`resource-${element.empId}`);
            $(`.fc-time-area  .resource-${element.empId} .fc-widget-content`).css("background","rgba(0, 0, 0, 0.12)");
            $(`.fc-time-area  .resource-${element.empId} .fc-widget-content`).bind('contextmenu', function(e) {
              return false;
          }); 
          }
        });
    }
  }
  eventSelects(info: any) {
    if (this.isDateClick) {
      return false;
    }
    this.eventSelect.emit({
      id: info.resource.id,
      startDate: new Date(info.start),
      endDate: new Date(info.end),
    });
  }

  setCalendar() {
    this.calendarDates = [];
    let h = 0;
    const dateHours = {
      date: this.date,
      dateTime: [],
    };

    /** for month */
    const startDay = startOfMonth(this.date);
    const end = lastDayOfMonth(this.date);
    const difference = differenceInDays(end, startDay);

    for (let i = 0; i <= difference && this.calendarViewOption === 5; i++) {
      let obj: any = { mainDateTime: addDays(startDay, i) };
      obj.subDateTime = [];
      this.dateTimeRowWidth = 0;

      for (let j = 0; j <= 23; j++) {
        obj.subDateTime.push(addHours(addDays(startDay, i), j));
        this.dateTimeRow.push(addHours(addDays(startDay, i), j));
        this.dateTimeRowWidth += 1;
      }
      dateHours.dateTime.push(obj);
    }

    /** for year */
    const yearObj = { 0: -1, 1: 0, 2: 1 };
    this.yearHeading = [];

    for (let year = 0; year < 3 && this.calendarViewOption === 6; year++) {
      this.dateTimeRowWidth = 3;
      this.yearHeading = [...this.yearHeading, ...this.quarterYear];
      const t1 = new Date(addYears(this.date, yearObj[year]));
      let firstDayofTheYear = startOfYear(t1);
      for (let i = 0; i < 12; i++) {
        // dateHours.dateTime.push(addMonths(firstDayofTheYear, i));
        this.dateTimeRow.push(addMonths(firstDayofTheYear, i));
      }
    }

    /** for week */
    const date = add(this.date, { weeks: -1 });

    for (let week = 0; week < 3; week++) {
      for (let i = 1; i <= 7 && this.calendarViewOption === 4; i++) {
        const first = date.getDate() - date.getDay() + i;
        const day = new Date(date.setDate(first)).toISOString().slice(0, 10);
        const t1 = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
        let obj: any = { mainDateTime: new Date(t1) };
        obj.subDateTime = [];
        this.dateTimeRowWidth = 0;
        for (let j = 0; j <= 23; j++) {
          obj.subDateTime.push(addHours(new Date(t1), j));
          this.dateTimeRow.push(addHours(new Date(t1), j));
          this.dateTimeRowWidth += 1;
        }

        dateHours.dateTime.push(obj);
      }
    }

    while (
      isSameDay(this.date, setHours(this.date, h)) &&
      [1, 2, 3].includes(this.calendarViewOption)
    ) {
      let currentHours = setHours(this.date, h);
      const obj: any = { mainDateTime: currentHours };

      // dateHours.dateTime.push(currentHours);

      let m = 0;

      obj.subDateTime = [];

      this.dateTimeRowWidth = 0;
      while (
        isSameHour(
          currentHours,
          setMinutes(currentHours, this.date.getMinutes() + m)
        )
      ) {
        // currentHours = setMinutes(currentHours, this.date.getMinutes() + m );
        // dateHours.dateTime.push(currentHours);
        obj.subDateTime.push(
          setMinutes(currentHours, this.date.getMinutes() + m)
        );
        this.dateTimeRow.push(
          setMinutes(currentHours, this.date.getMinutes() + m)
        );
        m += 5;
        this.dateTimeRowWidth += 1;
      }

      dateHours.dateTime.push(obj);

      // for hours -> minutes 15 or 30
      const min = { 1: 15, 2: 30 };
      if ([1, 2].includes(this.calendarViewOption)) {
        let m = 1;

        while (
          isSameHour(
            currentHours,
            setMinutes(
              currentHours,
              this.date.getMinutes() + m * min[this.calendarViewOption]
            )
          )
        ) {
          currentHours = setMinutes(
            currentHours,
            this.date.getMinutes() + m * min[this.calendarViewOption]
          );
          dateHours.dateTime.push(currentHours);
          m++;
        }
      }
      h++;
    }
    this.calendarDates = dateHours;
  }

  renderEvent() {
    for (const technicians of this.techniciansArray) {
      const eventCount = technicians.eventdata.length;
      for (let index = 0; index < eventCount; index++) {
        const event = technicians.eventdata[index];
        event.empId = technicians.empId;

        event.diff =
          Math.abs(
            new Date(event.startDate).getTime() -
            new Date(event.endDate).getTime()
          ) / 3600000;
        if (this.calendarViewOption == 4 || this.calendarViewOption == 5) {
          event.diff /= 24;
        }
        event.startDate = new Date(event.startDate);
        event.endDate = new Date(event.endDate);

        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);

        const upcomingEvents = technicians.eventdata.slice(0, index);
        event.upcomingEvent = upcomingEvents.filter((e) => {
          const eStartDate = new Date(e.startDate);
          const eEndDate = new Date(e.endDate);

          if (
            eStartDate.getTime() >= startDate.getTime() &&
            eStartDate.getTime() <= endDate.getTime()
          ) {
            return true;
          }
        });
      }
    }
  }

  selectStart(event, date, id) {
    if (this.isResizingEvent) {
      return false;
    }
    this.selectedEventData = { date, id };

    const selectedEvent = event.path[1].appendChild(
      document.createElement('div')
    );
    selectedEvent.style.position = 'absolute';
    selectedEvent.style.height = '100%';
    selectedEvent.style.top = '0px';
    selectedEvent.classList.add('temp-show');
    selectedEvent.style.width = '1px';
    selectedEvent.style.zIndex = '7';
    selectedEvent.style.pointerEvents = 'none';

    const obs = fromEvent(document, 'mousedown').pipe(
      flatMap((mousedown) => {
        return fromEvent(document, 'mousemove').pipe(
          takeUntil(fromEvent(document, 'mouseup'))
        );
      })
    );


    const sub = obs.subscribe((moveEvent: any) => {
      if (!this.selectedEventData) {
        sub.unsubscribe();
        return false;
      }

      const leftOffset = moveEvent.layerX;
      if (!leftOffset) {
        return false;
      }

      const defaultLeft = Number(selectedEvent.dataset.left);

      if (isNaN(defaultLeft)) {
        selectedEvent.setAttribute('data-left', leftOffset);
      }

      if (!selectedEvent.style.left) {
        selectedEvent.style.left = `${leftOffset}px`;
        return false;
      }

      if (defaultLeft > leftOffset) {
        // Selection right to left
        selectedEvent.style.left = `${leftOffset}px`;
        selectedEvent.style.width = `${defaultLeft - leftOffset - 2}px`;
      } else {
        // Selection left to right
        selectedEvent.style.width = `${leftOffset - defaultLeft}px`;
      }
      selectedEvent.style.backgroundColor = '#00b383';
    });
  }

  /**
   * Remove temp selection as event
   */
  removeTempSelection() {
    document.querySelectorAll('.temp-show').forEach((ele) => {
      ele.remove();
    });
  }

  /**
   *
   * @param event
   * @param date
   * @description if select start and end date for new event
   */
  selectEnd(event, date) {
    if (!this.selectedEventData || this.isResizingEvent) {
      this.removeTempSelection();
      return false;
    }
    if (isEqual(date, this.selectedEventData.date)) {
      this.selectedEventData = null;
      this.removeTempSelection();
      return false;
    }
    const id = this.selectedEventData.id;
    const dates = [new Date(this.selectedEventData.date), new Date(date)].sort(
      compareAsc
    );
    this.selectedEventData = null;
    this.eventSelect.emit({ id, startDate: dates[0], endDate: dates[1] });
  }

  /**
   * @description Get different between two date
   */
  getDiffHours() { }

  /**
   *
   * @param event
   * @param techEvent
   * @dees change any exiting event
   */

  /**
   *
   * @param event
   * @description On resizing event
   */
  onResizing(event, techEvent) {
    this.isResizingEvent = true;
  }


  deleteEvent(id) {
    this.eventDelete.emit(id);
  }

  OpenAddEvent() {
    this.addEventPopup.emit({ id: this.addEventTechId });
  }

  trackByTechnician(index: number, el: any) {
    return el.empId;
  }

  trackByMainDateTime(index: number, el: any) {
    return el.mainDateTime.toISOString();
  }

  trackByEvents(index: number, el: any) {
    return el.eventId;
  }

  trackBySubDateTime(index: number, el: any) {
    if (!el) {
      return null;
    }
    return el.toISOString();
  }

  calScrollByTech(technicians) {
    this.rightBlockTechniciansList = technicians;
    $('.index_i_left').scrollTop($('virtual-scroller').scrollTop());
  }

  trackByYearHeading(index: number, el: any) {
    return el;
  }

  startSelectEvent() {
    this.isResizingEvent = false;
  }

  stopSelectEvent() {
    this.isResizingEvent = true;
  }
  eventDragStop(model) {
    // console.log('model', model);
  }
  /*********Full calendar Events******************************* */

  eventClick(model) {
    // console.log('model', model.view);
  }
  clickButton(model) {
    // console.log('clickButton', model);
  }
  dateClick(model) {
    // console.log('dateClick', model);
  }
  updateEvents() {
    this.eventsModel = [
      {
        title: 'Updaten Event',
        start: this.yearMonth + '-08',
        end: this.yearMonth + '-10',
      },
    ];
  }
  get yearMonth(): string {
    const dateObj = new Date();
    return dateObj.getUTCFullYear() + '-' + (dateObj.getUTCMonth() + 1);
  }

  onContextMenu(mouseEvent: MouseEvent) {
    this.addEventTechId = null;
    this.editEventObj = null;
    if ($(mouseEvent.srcElement).parents('.fc-time-area').length) {
      this.addEventTechId = $(mouseEvent.srcElement).closest('tr').data("resource-id");
      this.contextMenuService.show.next({
        event: mouseEvent,
        item: {},
      });
    }
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();

  }
}
