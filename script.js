const actionButton = document.getElementById("actionButton");
const screenVideo = document.getElementById("screenVideo");

let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

actionButton.addEventListener("click", async () => {
  if (!isRecording) {
    try {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      console.log("Permission granted:", mediaStream);
      startRecording();
    } catch (error) {
      console.error("Error accessing screen: ", error);
      alert("Screen capture permission is required.");
    }
  } else {
    stopRecording();
  }
});

function startRecording() {
  screenVideo.srcObject = mediaStream; // Assign the media stream to the video element
  screenVideo.style.display = "block";
  screenVideo.muted = true; // Mute the video during recording
  actionButton.textContent = "Stop Recording";
  actionButton.style.backgroundColor = "#dc3545";
  actionButton.addEventListener("mouseover", () => {
    actionButton.style.backgroundColor = "#bd2130";
  });
  actionButton.addEventListener("mouseout", () => {
    actionButton.style.backgroundColor = "#dc3545";
  });

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(mediaStream);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screen_capture.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    mediaStream.getTracks().forEach((track) => track.stop()); // Stop the tracks after recording is finished
  };
  mediaRecorder.start();
  isRecording = true;
}

function stopRecording() {
  if (mediaStream) {
    mediaRecorder.stop();
    screenVideo.style.display = "none";
    actionButton.textContent = "Start Recording";
    actionButton.style.backgroundColor = "#007bff";
    actionButton.addEventListener("mouseover", () => {
      actionButton.style.backgroundColor = "#0056b3";
    });
    actionButton.addEventListener("mouseout", () => {
      actionButton.style.backgroundColor = "#007bff";
    });
    isRecording = false;
  }
}
