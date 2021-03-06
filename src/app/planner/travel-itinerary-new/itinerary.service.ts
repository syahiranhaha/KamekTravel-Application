import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { WishlistItineray } from 'src/app/wishlist/wishlist.model';
import { PlannerService } from '../planner.service';
import { Itinerary } from './itinerary.model';
import { TravelItineraryNewPage } from './travel-itinerary-new.page';

interface ItineraryData{
  id: string;//id of places
  time: string;
  notes: string;
  itinerary: WishlistItineray;
  userId : string;
  plannerId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {


  private _itinerary = new BehaviorSubject<Itinerary[]>([]);

  get itinerary(){
    return this._itinerary.asObservable();
  }

  constructor(
    private authServicePD : AuthService,
    private httpsendiri: HttpClient,
    //private placesservicehere: PlannerService
  ) { }


  addItinerary(
  time: string,
  notes: string,
  itinerary: WishlistItineray,
  PlannerId: string
  ){
    let generatedId: string;
    let newItinerary: Itinerary;
    let fetchedUserId: string;
    return this.authServicePD.userId.pipe(take(1), switchMap(userId => {
      if (!userId) {
        throw new Error('No user id found!');
      }
      fetchedUserId = userId;
      return this.authServicePD.token;
    }),
    take(1),
    switchMap(token => {
      newItinerary = new Itinerary(
        Math.random().toString(),
        time,
        notes,
        itinerary,
        fetchedUserId,
        PlannerId
        );
        return this.httpsendiri.post<{name:string}>(`https://kamektravel-default-rtdb.asia-southeast1.firebasedatabase.app/itinerary.json?auth=${token}`,
        { ...newItinerary, id: null }
        );

    }),

    switchMap(resData => {
      generatedId = resData.name;
      return this.itinerary;
    }),
    take(1),
    tap(itinerary => {
      newItinerary.id = generatedId;
      this._itinerary.next(itinerary.concat(newItinerary));
    })
    );
  }

  fetchItinerary(id:string){
    let fetchedUserId: string;
    return this.authServicePD.userId.pipe(
      take(1),switchMap(userId => {
      if(!userId){
        throw new Error('User Not Found');
      }
      fetchedUserId = userId;
      return this.authServicePD.token;

    }),
      take(1),
      switchMap(token => {
        return this.httpsendiri
    .get<{[key:string]: ItineraryData }>(`https://kamektravel-default-rtdb.asia-southeast1.firebasedatabase.app/itinerary.json?orderBy="plannerId"&equalTo="${id}"&auth=${token}`
    );
      }),
      map(ItineraryData => {
        const planner = [];
        for(const key in ItineraryData){
          if(ItineraryData.hasOwnProperty(key)){
            planner.push
            (new Itinerary(
              key,
              ItineraryData[key].time,
              ItineraryData[key].notes,
              ItineraryData[key].itinerary,
              ItineraryData[key].userId,
              ItineraryData[key].plannerId
              )
            );
          }
        }
        return planner;
      }),
      tap(planner=> {
      this._itinerary.next(planner);
      })
    );
  }

  cancelBooking(plannerId: string){
    return this.authServicePD.token.pipe(take(1), switchMap(token => {
      return this.httpsendiri
    .delete(`https://kamektravel-default-rtdb.asia-southeast1.firebasedatabase.app/itinerary/${plannerId}.json?auth=${token}`)
    }),
    switchMap(()=>{
        return this.itinerary;
      }),
      take(1),
      tap(Itinerary => {
          this._itinerary.next(Itinerary.filter(b => b.id !== plannerId));
        }
      )
    );
  }

  getItinerary(id: string) {
    return this.authServicePD.token.pipe(take(1),switchMap(token => {
      return this.httpsendiri
    .get<ItineraryData>(`https://kamektravel-default-rtdb.asia-southeast1.firebasedatabase.app/itinerary/${id}.json?auth=${token}`)
    }),
      map(ItineraryData => {
        return new Itinerary(
          id,
          ItineraryData.time,
          ItineraryData.notes,
          ItineraryData.itinerary,
          ItineraryData.userId,
          ItineraryData.plannerId
        );
      })
      //   tap(resData => {console.log(resData);})
    );
  }

  updateItinerary(id: string, ItineraryId: string, time: string, notes: string){
    let updatedItinerary: Itinerary[];
    let fetchedToken: string;
    return this.authServicePD.token.pipe(take(1), switchMap(token => {
      fetchedToken = token;
      return this.itinerary;
    }),
       take(1),
       switchMap(itinerary => {
         if (!itinerary || itinerary.length <=0){
           return this.fetchItinerary(id);
         } else {
           return of(itinerary);
         }
      }),
      switchMap(itinerary => {
        let id1 = 'McIlIyq9TO34sJ6TgqD';
        let hello = 'hello';
        const updatedItineraryIndex = itinerary.findIndex(ntah => ntah.id === ItineraryId);
        updatedItinerary = [...itinerary];
        const oldRate = updatedItinerary[updatedItineraryIndex];
        updatedItinerary[updatedItineraryIndex] = new Itinerary(
          oldRate.id,
          time,
          notes,
          oldRate.itinerary,
          oldRate.userId,
          oldRate.plannerId
        );
        return this.httpsendiri.put(
          `https://kamektravel-default-rtdb.asia-southeast1.firebasedatabase.app/itinerary/${ItineraryId}.json?auth=${fetchedToken}`,
          {...updatedItinerary[updatedItineraryIndex], id: null}
        );}),
      tap(() => {
        this._itinerary.next(updatedItinerary);
      })
    );
  }


}
