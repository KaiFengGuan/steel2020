export function addElement(g, tag, attrs){
  let element = g.append(tag);
  return updateElement(element, attrs);
}
export function updateElement(element, attrs){
  for(let item in attrs){
    if(item == 'text'){
      element.text(attrs[item])
    }else if(item == 'datum'){
      element.datum(attrs[item])
    }else{
      element.attr(item, attrs[item])
    }
  }
  return element;
}
export function updateDatum(element, attrs){
  delete attrs['datum'];
  delete attrs['data'];
  return updateElement(element, attrs);
}
export function updateAsyncElement(element, attrs){
  for(let item in attrs){
    if(attrs[item] instanceof Function){
      if(item == 'text'){
        element.text(attrs[item])
      }else{
        element.attr(item, attrs[item])
      }
    }
  }
  return element;
}