const video = document.getElementById("video");
const input = document.getElementById("videoInput");
const grid = document.getElementById("grid");

const identities = {};
let nextId = 0;

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
}

function cosine(a,b){
  let s=0;
  for(let i=0;i<a.length;i++) s+=a[i]*b[i];
  return 1-s;
}

function matchFace(emb){
  let best={id:null,score:1};
  for(const id in identities){
    for(const e of identities[id]){
      const c=cosine(emb,e);
      if(c<best.score) best={id,score:c};
    }
  }
  return best.score<0.6?best.id:null;
}

function addCard(id){
  const d=document.createElement("div");
  d.className="card";
  d.innerHTML=`<p>Person ${id}</p><input type="file">`;
  grid.appendChild(d);
}

async function processFrame(){
  const canvas=document.createElement("canvas");
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;
  canvas.getContext("2d").drawImage(video,0,0);

  const dets=await faceapi
    .detectAllFaces(canvas,new faceapi.TinyFaceDetectorOptions())
    .withFaceDescriptors();

  dets.forEach(d=>{
    const id=matchFace(d.descriptor);
    if(id===null){
      identities[nextId]=[d.descriptor];
      addCard(nextId);
      nextId++;
    }else{
      identities[id].push(d.descriptor);
    }
  });
}

input.onchange=async e=>{
  await loadModels();
  video.src=URL.createObjectURL(e.target.files[0]);
  video.onloadeddata=async ()=>{
    for(let t=0;t<video.duration;t+=1){
      video.currentTime=t;
      await new Promise(r=>video.onseeked=r);
      await processFrame();
    }
    alert("Detection complete");
  };
};
