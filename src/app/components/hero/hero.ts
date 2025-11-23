import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { CatAndDogAnimation } from '../cat-and-dog-animation/cat-and-dog-animation';


@Component({
  selector: 'app-hero',
  imports: [NgClass, CatAndDogAnimation],
  templateUrl: './hero.html',
})
export class Hero {}
