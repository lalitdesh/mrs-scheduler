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
import { ResizeEvent } from 'angular-resizable-element';
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
import { DragulaService } from 'ng2-dragula';
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

  constructor(private dragulaService: DragulaService) {
    this.elem = document.documentElement;

    this.Math = Math;
    this.subs.add(
      this.dragulaService
        .drop('SPILL')
        .subscribe(({ name, el, target, source, sibling }) => {
          console.log('name', name);
          console.log('el', el);
          // console.log("eventsss",$(el).children().eq(1)[0].id);
          // console.log("target",target)
          // console.log("target.id",target.id)
          // console.log("source",source)
          // console.log("sibling",sibling)
          // console.log("$(el).children()",$(el).children())
          // console.log("$(el).children()",$(el).children()[0].id)
          if (
            !$(el).children() ||
            !($(el).children()[0] && $(el).children()[0].id)
          ) {
            return false;
          }

          console.log('$(el).children()[0].id', $(el).children()[0].id);
          let eventArray = JSON.parse($(el).children()[0].id);
          const startingDate = new Date(sibling.id);
          const diff = eventArray.diff * 60;
          const empId = target.id;
          let endIngDate: Date;
          if (this.calendarViewOption == 3) {
            endIngDate = addMinutes(startingDate, diff);
          }
          if (this.calendarViewOption == 4 || this.calendarViewOption == 5) {
            endIngDate = addMinutes(startingDate, diff * 24);
          }
          console.log('startDate', startingDate);
          console.log('endDate', startingDate);
          console.log('diff', diff);
          // console.log("diff",empId);
          const startDate = format(startingDate, 'MM/dd/yyyy');
          const startTime = format(startingDate, 'hh:mm a');
          const endDate = format(endIngDate, 'MM/dd/yyyy');
          const endTime = format(endIngDate, 'hh:mm a');
          this.dragEvent.emit({
            eventId: eventArray.eventId,
            taskName: eventArray.taskName,
            empId: empId,
            startDate: `${startDate} ${startTime}`,
            endDate: `${endDate} ${endTime}`,
            status: eventArray.statusId,
          });
        })
    );
    // dragulaService.createGroup("ITEMS", {
    //   removeOnSpill: true
    // });

    dragulaService.createGroup('SPILL', {
      revertOnSpill: true,

      moves: (el, container, handle) => {
        console.log('code here ', el);
        // console.log('handle', handle.className.match(/can-drag/g).length);
        console.log('this.isResizingEvent', this.isResizingEvent);
        let canDrag = handle.className.match(/can-drag/g);
        return canDrag && canDrag.length ? true : false;
      },
    });
  }
  ngAfterViewChecked(): void {
    this.setLefTColTechnicianHeight();
  }
  ngOnChanges() {
    this.dateTimeRow = [];
    console.log('code change');
    this.calendarViewOption = this.calendarIndex['id'];
    this.date.setHours(0);
    this.date.setMinutes(0);
    this.date.setSeconds(0);
    this.date.setMilliseconds(0);

    this.techniciansArray.forEach((tech) => {
      this.techniciansById[tech.empId] = tech;
    });

    if(this.techniciansArray.length > 0){
      console.log("thsitech",this.techniciansArray)
      this.techniciansArray.forEach((element) => {
        this.resources.push({
          id: element.empId,
          title: element.empName,
        });
        if (element.eventCount > 0) {
          element.eventdata.forEach((element1) => {
            this.allEvents.push(element1);
            this.events.push({
              id: element1.eventId, 
              resourceId: element.empId,
              title: `${element1.taskName}\n${element1.tenantName}\n${element1.status}`,
              start: new Date(element1.startDate),
              end: new Date(element1.endDate),
              customRender: true,
              taskName: element1.taskName,
              className: `status-${element1.statusId}`, //  override!
            });
          });
        }
      });
      this.initFullcalendar();
    }

    console.log('resources', this.resources);
    this.initFullcalendar();
    this.setCalendar();
    this.removeTempSelection();
    this.calendarHeadingFormat = 'E MM/dd';
    console.log('this.calendarIndexAfterChange', this.calendarIndex);

    switch (this.calendarViewOption) {
      case 1:
        /** 15 minutes */
        this.calendarHeadingFormat = 'E MM/dd';

        break;
      case 2:
        /** half an hours */
        this.calendarSubHeadingFormat = 'hh:mm aa';

        break;
      case 3: {
        /** for hours */
        $('.fc-resourceTimelineDay-button').click();

        this.calendarSubHeadingFormat = 'hh:mm aa';
        this.renderEvent();
        break;
      }
      case 4:
        /** week */
        $('.fc-resourceTimelineWeek-button').click();
        this.calendarSubHeadingFormat = 'EEEE';
        this.renderEvent();

        break;
      case 5: {
        /** for month */
        $('.fc-resourceTimelineMonth-button').click();
        this.calendarHeadingFormat = 'MMM yyyy';
        this.calendarSubHeadingFormat = 'dd MMMM';
        this.renderEvent();

        // this.setMonthCalendar();
        break;
      }
      case 6:
        /** year */
        $('.fc-resourceTimelineYear-button').click();
        this.calendarSubHeadingFormat = 'MMM yyyy';

        break;
    }
  }
  initFullcalendar() {
    let that = this;
    console.log('this.calendarIndex', this.calendarIndex);
    console.log('this.aftersss', this.events);
    setTimeout(() => {
      

      this.options = {
        editable: true, // don't allow event dragging
        selectable: true,
        // eventResourceEditable: true, // except for between resources
        droppable: true,
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
            'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth,resourceTimelineYear',
        },
        eventClick: (info) => {
          // alert('Event: ' + info.event);

          that.eventUpdates(info.event);
        },
        select: (info) => {
          // alert(info.resource.id + 'selected ' + info.startStr + ' to ' + info.endStr);
          that.eventSelects(info);
        },
        eventDrop: (info: any) => {
          let resourceId;
          if (info.newResource) {
            resourceId = info.newResource.id;
          } else {
            const index = that.allEvents.findIndex(
              (x) => x['eventId'] === info.event.id
            );
            console.log('info.event', that.allEvents);
            resourceId = that.allEvents[index].empId;
          }
          that.eventDragStopF(info.event, resourceId);
        },
        eventResize: (info) => {
          that.eventDragResize(info.event);
        },
        // tslint:disable-next-line:no-string-literal
        defaultView: this.calendarIndex['cal'],
        eventRender: this.eventRender,
        // expandRows: true,
        resources: this.resources,
        events: this.events,
        resourceLabelText: 'Technician List',

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
                <div ><small>${techObj.eventCount || 0} Events</small></div>
              </div>
            </div>`;
          $(resourceObj.el).find('.fc-cell-content').html(techHTML);
        },
      };
    }, 1000);
  }
  // will be using it with tooltip js
  eventRender = (event: any) => {
    $(event.el).on('contextmenu', (e: any) => {
      e.preventDefault();
    });
    return event.el;
  };
  ngOnInit(): void {
    this.initFullcalendar();
  }
  eventUpdates(event: any) {
    const index = this.allEvents.findIndex((x) => x['eventId'] === event.id);

    console.log('event', this.allEvents[index]);
    this.eventUpdate.emit(this.allEvents[index]);
  }
  eventDragStopF(event: any, empId) {
    const index = this.allEvents.findIndex((x) => x['eventId'] === event.id);
    // console.log("this",this.allEvents[index]);
    // console.log("this",this.allEvents[index].status);
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
    console.log(obj);
  }
  eventDragResize(event) {
    console.log('event', event);
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
    // console.log(obj)
  }

  setLefTColTechnicianHeight() {
    this.techniciansArray.forEach((element) => {
      var rightRowHeight = $(`.event-row-${element.empId}`).height();
      $(`.technician-${element.empId}`).css('height', rightRowHeight);
    });
  }
  eventSelects(info: any) {
    this.eventSelect.emit({
      id: info.resource.id,
      startDate: new Date(info.startStr),
      endDate: new Date(info.endStr),
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

      // console.log('obj', obj);

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
    //  console.log('this.dateTimeRowWidth',     this.calendarDates = dateHours;
    //  );
    console.log('this.dateTimeRow', dateHours);
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
        // console.log("Event",event)

        // console.log("difffs",event.diff)
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

    console.log('Mouse down');

    const sub = obs.subscribe((moveEvent: any) => {
      if (!this.selectedEventData) {
        sub.unsubscribe();
        return false;
      }

      const leftOffset = moveEvent.layerX;
      if (!leftOffset) {
        return false;
      }
      console.log('Mouse drag down ', this.selectedEventData);

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
      console.log('selectedEvent', selectedEvent);
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
  getDiffHours() {}

  /**
   *
   * @param event
   * @param techEvent
   * @dees change any exiting event
   */
  onResizeEnd(event: ResizeEvent, techEvent): void {
    console.log('onResizeEnd', event.edges);
    let edges = Number(event.edges.right) || Number(event.edges.left);

    let newHoursTotal;
    if (edges < 0) {
      newHoursTotal = Number(edges) / 100;
    } else {
      newHoursTotal = Number(edges) / 100;
    }

    console.log('newHoursTotal', newHoursTotal);

    // return false;

    const cellDiff: number = Number(edges / (200 / this.dateTimeRowWidth));
    const min: number = Math.floor(cellDiff * 5);

    if (event.edges.left) {
      if (this.calendarViewOption === 3) {
        techEvent.startDate = new Date(techEvent.startDate);
        setTimeout(() => {
          techEvent.startDate = new Date(
            techEvent.startDate.setMinutes(
              techEvent.startDate.getMinutes() + min
            )
          );
        });
      }
    }

    if (event.edges.right) {
      if (this.calendarViewOption === 3) {
        console.log('techEvent.endDate', techEvent.endDate.toISOString());
        techEvent.endDate = new Date(techEvent.endDate);
        techEvent.endDate = new Date(
          techEvent.endDate.setMinutes(techEvent.endDate.getMinutes() + min)
        );
        console.log('techEvent.endDate', techEvent.endDate.toISOString());
      }
    }

    // console.log('techEvent', techEvent);
    this.eventDateChange.emit(techEvent);
    this.isResizingEvent = false;
  }

  /**
   *
   * @param event
   * @description On resizing event
   */
  onResizing(event, techEvent) {
    this.isResizingEvent = true;
  }

  updateEvent(event, empId) {
    event.empId = empId;
    this.eventUpdate.emit(event);
  }
  deleteEvent(id) {
    this.eventDelete.emit(id);
  }

  OpenAddEvent() {
    this.addEventPopup.emit();
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
    // console.log('el', el);
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
    console.log('model', model);
  }
  /*********Full calendar Events******************************* */

  eventClick(model) {
    console.log('model', model.view);
  }
  clickButton(model) {
    console.log('clickButton', model);
  }
  dateClick(model) {
    console.log('dateClick', model);
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
}
