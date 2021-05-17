import React from './react';
import ReactDom from './react-dom';
let numCount = 1;

document.addEventListener('click', ()=>{
  let element = (
    <div id="A1">
      <div id="B1">
        <div id="C1">{`${numCount}-C1`}</div>
        <div id="C2">
          {`${numCount}-C2`}
          <div id="D1">{`${numCount}-D1`}</div>
        </div>
      </div>
      <div id="B2">{`${numCount}-B2`}</div>
    </div>
  );
  console.log('element:', element);
  ReactDom.render(element, document.getElementById('app'));
  numCount++;
});