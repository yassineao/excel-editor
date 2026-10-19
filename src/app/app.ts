import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Home } from './components/home/home';
import { Footer } from './shared/footer/footer';
import { NavBar } from './shared/nav-bar/nav-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Home, Footer, NavBar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
