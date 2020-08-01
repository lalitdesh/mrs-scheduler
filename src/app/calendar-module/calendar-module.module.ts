import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponents } from './calendar/calendar.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ContextMenuModule } from 'ngx-contextmenu';
import { FullCalendarModule } from 'ng-fullcalendar';

import interactionPlugin from '@fullcalendar/interaction'; // a plugin







@NgModule({
  declarations: [CalendarComponents],
  imports: [
    CommonModule, 
    TooltipModule.forRoot(),
    ContextMenuModule.forRoot(),
    FullCalendarModule
  ],
  exports: [CalendarComponents],
})
export class CalendarModuleModule {}
