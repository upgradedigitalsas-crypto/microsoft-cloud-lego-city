// Continuous wheel/trackpad zoom, independent of event frequency and frame rate.
export function smoothNavigation(camera, controls, canvas, onInteract) {
  let target=null;
  const offset=camera.position.clone();
  function wheel(event){
    if(!controls.enabled || !controls.enableZoom)return;
    event.preventDefault();event.stopImmediatePropagation();onInteract();
    const unit=event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1;
    const delta=Math.max(-240,Math.min(240,event.deltaY*unit));
    const current=camera.position.distanceTo(controls.target);
    target=Math.max(controls.minDistance,Math.min(controls.maxDistance,
      (target??current)*Math.exp(delta*(event.ctrlKey?.006:.0015))));
  }
  function cancel(){target=null;}
  canvas.addEventListener('wheel',wheel,{passive:false,capture:true});
  canvas.addEventListener('pointerdown',cancel);
  return {
    cancel,
    update(dt){
      if(target===null)return;
      offset.copy(camera.position).sub(controls.target);
      const distance=offset.length();
      if(distance===0){cancel();return;}
      const next=distance+(target-distance)*(1-Math.exp(-20*dt));
      offset.multiplyScalar(next/distance);camera.position.copy(controls.target).add(offset);
      if(Math.abs(next-target)<.005)cancel();
    },
    dispose(){canvas.removeEventListener('wheel',wheel,true);canvas.removeEventListener('pointerdown',cancel);}
  };
}
