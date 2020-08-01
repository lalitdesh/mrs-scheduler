import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders,HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IEventFormRequest } from './interfaces/app';
import { ToastrService } from 'ngx-toastr';
import { format } from 'date-fns';

// import { parse } from 'path';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
  private apiEndpoint =
    'https://cyclesoon.com/myroofservices/index.php';

  constructor(private httpClient: HttpClient,
              private toastr: ToastrService) {
    return this;
  }
  /** 
   * Get technician lists with their events
   *
   * @author Shubham Azad
   * @returns Observable<any>
   */
  getTechniciansList(date:any): Observable<any> {
    const body = new URLSearchParams();
    // const startDate = format(formvalues.start_date, 'MM/dd/yyyy');

   const parms='?startDate='+format(date[0],'dd/MM/yyyy')+"&endDate="+format(date[1], 'dd/MM/yyyy');
    console.log("parms",parms)
    const httpOptions = {
      headers: { 'Content-Type': 'application/json' },
      
  };
    return this.httpClient.get( 
      `${this.apiEndpoint}/user/getTechniciansListWithEvents`+parms,
      {
        headers: this.headers,
      }
    ); 

    // return this.httpClient.get(`${this.apiEndpoint}/user/getTechniciansListWithEvents`, {
    //   headers: this.headers,
    // });
  }
    /** 
   * Get searchServiceOredrNameWithReason    *
   * @author Shubham Azad
   * @returns Observable<any>
   */
  serviceOredrNameWithReason(date:any): Observable<any> {
    const body = new URLSearchParams();
    body.set("searchText", date);
    return this.httpClient.post(
      `${this.apiEndpoint}/user/searchServiceOredrNameWithReason`,
      body.toString(),
      {
        headers: this.headers,
      }
    );
  }

  

  
  /**
   * Get Order lists with their events
   *
   * @author Shubham Azad
   * @returns Observable<any>
   */
  getOrderStatus(): Observable<any> {
    return this.httpClient.get(`${this.apiEndpoint}/user/getserviceOrderStatus`, {
      headers: this.headers,
    });
  }
    /**
   * Get Order lists with their events
   *
   * @author Shubham Azad
   * @returns Observable<any>
   */
  getTenant(): Observable<any> {
    return this.httpClient.get(`${this.apiEndpoint}/user/getNotAsignedTenantName`, {
      headers: this.headers,
    });
  }

  
  /**
   * add event for given technician
   *
   * @author Shubham Azad
   * @returns Observable<any>
   */
  addEvent(formvalues): Observable<any> {
    console.log(formvalues)
    const body = new URLSearchParams();
    body.set("taskName", formvalues.taskName);
    body.set("startDate", formvalues.startDate);
    body.set("endDate", formvalues.endDate);
    body.set("empId", formvalues.empId );
    body.set("eventId", formvalues.eventId );
    body.set("status", formvalues.status);

    return this.httpClient.post(
      `${this.apiEndpoint}/user/assignEvent`,
      body.toString(),
      {
        headers: this.headers,
      }
    );
  }
  /**
   * function for delete event
   * @param number id 
   */
  deleteEvent(id){
    const body = new URLSearchParams();
    body.set("eventId",id);

    return this.httpClient.post(
      `${this.apiEndpoint}/user/unassignEvent`,
      body.toString(),
      {
        headers: this.headers,
      }
    );
  }
  toastMessage(condtionCode:number,message:string){
    console.log("condtionCode",condtionCode);
    switch(condtionCode) {
      case 0:
    console.log("addd",condtionCode);

        this.toastr.error(message,"Error" ); // Error Case
        break;
      case 1:
        this.toastr.success(message,"Success" );// Success Case
        break;
      default:
        
    } 
  }
  
}
