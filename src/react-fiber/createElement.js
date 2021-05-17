import { ELEMENT_TEXT } from './constant';

export default function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(item=>{
        console.log('item:', typeof item, item);
        return typeof item === 'object' ? item : {
          type: ELEMENT_TEXT,
          props: {
            text: item,
            children: []
          }
        };
      })
    }
  };
}