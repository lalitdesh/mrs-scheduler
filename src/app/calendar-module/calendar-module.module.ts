import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponents } from './calendar/calendar.component';
import { ResizableModule } from 'angular-resizable-element';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ContextMenuModule } from 'ngx-contextmenu';
import { DragulaModule } from 'ng2-dragula';
import { AvatarModule } from 'ngx-avatar'; 
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { FullCalendarModule } from 'ng-fullcalendar';

import interactionPlugin from '@fullcalendar/interaction'; // a plugin






@NgModule({
  declarations: [CalendarComponents],
  imports: [
    CommonModule, 
    ResizableModule,
    TooltipModule.forRoot(),
    ContextMenuModule.forRoot(),
    DragulaModule.forRoot(), 
    AvatarModule,
    VirtualScrollerModule,
    FullCalendarModule
  ],
  exports: [CalendarComponents],
})
export class CalendarModuleModule {}
