import { Component, OnInit } from '@angular/core';
import { DbService } from '../db.service'
import {SavedCoursesService} from '../saved-courses.service'
import { MatExpansionModule }from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { timeout } from 'rxjs/operators';
import { LocalStorageService }from '../local-storage.service';

 
@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {

  showOwnedSchedules:boolean=false;

  looper :boolean = true;

  //editing schedule
  editing: any;
  oldScheduleName: string;

  newScheduleName: string;
  isPublic: boolean;
  description: string;

  deleteScheduleName: string;
  
  timetableSchName: string;
  timetable:any[];
  ttSearchSubject:string = "";
  ttSearchCode:string = "";
  ttSearchComp:string = "";

  results: any;
  message: any;

  savedCourses: any;
  temp :any;
  courseCodes: any[] = [];
  subjects: any[] = [];
  components: any[] = [];
  startTimes: any[] = [];
  endTimes: any[] = [];
  days: any[] =[];

  constructor(private db: DbService,
              private scService: SavedCoursesService,
              private ls: LocalStorageService) {this.isPublic = false , this.description = ""}

  ngOnInit(): void {
    this.displaySchedules();
  }
  filterSchedules(sch){
    if(this.showOwnedSchedules)
    {
      return sch.filter(x=> x.email == this.ls.getLog())
    }
    else{return sch}
  }

  switchShowing(){
    if(this.showOwnedSchedules == false)
    {
      this.showOwnedSchedules = true;
    }
    else{
      this.showOwnedSchedules = false;
    }
  }

  editSave(){
    this.db.saveEdits(this.oldScheduleName, this.editing).subscribe(data=>{
      alert(data)
    }, error=> {
      alert(error.error)
    })
    this.oldScheduleName = this.editing.schedule_name;
  }

  editChangeVisibility(){
    console.log(this.editing.public== false)
    if(this.editing.public == false)
    {
      this.editing.public = true;
    }
    else{
      this.editing.public = false
    }
  }

  refreshEdits(){
    var temp = this.editing;
    this.editing = undefined;
    this.editing = temp;
  }

  editRemoveCourse(index: Number){
    this.editing.subjects.splice(index,1);
    this.editing.course_codes.splice(index,1);
    this.editing.components.splice(index,1);
    this.refreshEdits();
  }

  editSchedule(param: any){
    this.editing = param;
    this.oldScheduleName = this.editing.schedule_name
    console.log(this.editing)
    this.results = undefined;
  }

  makePrivate(){
    this.isPublic=false;
  }
  makePublic(){
    this.isPublic=true;
  }

  displaySchedules(){
    this.db.getSchedules().subscribe(data => {
      this.results = data
      this.results = this.results.result.filter(x=> x.email == this.ls.getLog() || x.public == true)
      let length = this.results.length;
      for (let i = 1; i < length; i++) {
      let key = this.results[i];
      let j = i - 1;
      while (j >= 0 && this.results[j].last_edit.replace(/\D/g, '') < key.last_edit.replace(/\D/g, '')) {
        this.results[j + 1] = this.results[j];
          j = j - 1;
      }
      this.results[j + 1] = key;
      }
  })
  this.timetable = undefined;
  this.editing = undefined;
}

  createNewSchedule(){
    this.db.saveSchedule(this.newScheduleName, this.isPublic, this.description).subscribe(data=>{
      alert(data)
      this.displaySchedules();
      this.description ="";
    },error =>{
      alert(error.error)
    });
  }

  deleteScheduleNamed(name: string){
    if(confirm("are you sure you want to delete "+ name))
    {
      this.db.deleteASchedule(name).subscribe(data =>{
        alert(data);
        this.displaySchedules();
      },error => {
        alert(error.error)
      })
    }
  }

  deleteSchedule(){
    if(confirm("are you sure you want to delete "+ this.deleteScheduleName))
    {
      this.db.deleteASchedule(this.deleteScheduleName).subscribe(data =>{
        alert(data);
        this.displaySchedules();
      },error => {
        alert(error.error)
      })
    }
  }

  importCourses(schedule:any){
    this.savedCourses = this.scService.getSavedCourses()
    if(this.savedCourses.length > 0)
    {
      for(let c of this.savedCourses)
      {
          this.db.getCourseInfoBySubject(c.subject).subscribe(data=>{
          this.temp = data;
          this.temp = this.temp.result.filter(x=> x.class_name == c.class_name && x.component == c.component)
          this.courseCodes.push(this.temp[0].course_code+"")
          this.subjects.push(c.subject)
          this.components.push(c.component)
          if(this.components.length == this.savedCourses.length)
          {
            this.editing.subjects = this.subjects
            this.editing.course_codes = this.courseCodes
            this.editing.components = this.components
            this.db.putCoursesIntoSchedule(schedule.schedule_name, this.subjects,this.courseCodes,this.components).subscribe(data =>{
              alert(data)
              this.resetVariables()
              this.scService.resetSavedCourses();
              this.savedCourses = [];
              this.refreshEdits();
            },error => {
              alert(error.error)
            })
          }
        })
      }
    }
    else{
      alert("There are no saved courses")
    }
  }
  
  openTimeTable(sch: any){
    this.db.getScheduleContentsByName(sch.schedule_name).subscribe(data => {
      this.timetableSchName = sch.schedule_name;
      this.temp = data;
      this.temp = this.temp.result;
      if(this.temp[0].components.length >0)
      {
      this.courseCodes = this.temp[0].course_codes;
      this.subjects = this.temp[0].subjects;
      this.components = this.temp[0].components;
      for(let i = 0; i < this.components.length; i++)
      {
        this.db.getCourseTimeTable(this.subjects[i], this.courseCodes[i], this.components[i]).subscribe(data =>{
          this.temp = data;
          this.temp = this.temp.result;
          this.startTimes.push(this.temp[0].start_time);
          this.endTimes.push(this.temp[0].end_time);
          this.days.push(this.temp[0].days);
          console.log(this.days.length)
          if(this.days.length == this.components.length)
          {
            this.timetable = []
            for(let x = 0; x< this.components.length; x++)
            {
              this.temp = {
                subject: this.subjects[x],
                course_code: this.courseCodes[x],
                component: this.components[x],
                start_time: this.startTimes[x],
                end_time: this.endTimes[x],
                days: this.days[x]
              }
              this.timetable.push(this.temp);
            }
            this.results = undefined;
            this.editing = undefined;
            this.resetVariables();
          }
        }, error => {
          alert(error.error)
        })
      }
    }
    else{
      alert("The selected schedule is empty")
    }
    },error=>{
      alert(error.error)
    })
  }

  filterBySubject(timetable:any){
    return timetable.filter(x => x.subject.indexOf(this.ttSearchSubject.toUpperCase()) > -1)
  }

  filterByCode(timetable:any){
    return timetable.filter(x => x.course_code.indexOf(this.ttSearchCode.toUpperCase()) > -1)
  }

  filterByComp(timetable:any){
    return timetable.filter(x => x.component.indexOf(this.ttSearchComp.toUpperCase()) > -1)
  }
  
  resetVariables(){
    this.subjects = [];
    this.courseCodes = [];
    this.components = [];
    this.days = [];
    this.startTimes = [];
    this.endTimes = [];
  }
}

