export function addElement(g, tag, attrs){
  let element = g.append(tag);
  return updateElement(element, attrs);
}
export function updateElement(element, attrs){
  for(let item in attrs){
    if(item == 'text'){
      element.text(attrs[item])
    }else{
      element.attr(item, attrs[item])
    }
  }
  return element;
}
export function updateAsyncElement(element, attrs){
  for(let item in attrs){
    if(! attrs[item] instanceof Object){
      if(item == 'text'){
        element.text(attrs[item])
      }else{
        element.attr(item, attrs[item])
      }
    }
  }
  return element;
}