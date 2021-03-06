import { Component, OnInit } from '@angular/core';
import { logging } from 'protractor';
import { fromEventPattern } from 'rxjs';
import { DbService }from '../db.service';
import { LocalStorageService } from '../local-storage.service';
import { Router } from '@angular/router';
import { AppComponent } from '../app.component';
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  //Login stuff
  email: string;
  password: string;


  //Demo stuff
  showCourse: boolean;


  constructor(private db:DbService, private router: Router, private ls :LocalStorageService, private a : AppComponent) { }

  ngOnInit(): void {
    this.email = "";
    this.password = "";
    this.showCourse = true;
  }

  showCourses(){
    this.showCourse = true;
  }
  showSchedules(){
    this.showCourse = false;
  }

  login(){
    if(this.email ==""){alert("Please enter an email")}
    else if(this.password ==""){alert("Please enter an password")}
    else
    {
      this.db.userLogin(this.email, this.password).subscribe(data => {
        this.ls.setToken(data);
        this.db.verifyUser().subscribe(data =>{
          var results: any = data
          this.ls.setLog(results.email);
          if(results.admin==true)
          {
            this.ls.adminTrue();
          }
          alert("Logged in!");
          this.router.navigateByUrl('courses');
          this.a.NewLogin();
        })
      }, error => {
        alert(error.error);
      })
    }
  }
  
}
