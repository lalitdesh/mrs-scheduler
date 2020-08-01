export interface IEventFormFields {
  // service_order:string,
  task_name: string;
  emp_id: number | null;
  eventId: number | null;
  status: number | null;
  start_date: Date;
  end_date: Date;
  start_time: Date;
  end_time: Date;
}

export interface IEventFormRequest {
  taskName: string;
  startDate: string;
  endDate: string;
  empId: number | null;
  eventId: number | null;
  status: number | null;
}
