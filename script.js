const actionButton = document.getElementById("actionButton");
const buttonText = document.getElementById("buttonText");
const screenVideo = document.getElementById("screenVideo");
const placeholder = document.getElementById("placeholder");
const timer = document.getElementById("timer");
const recordingTime = document.getElementById("recordingTime");
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");

let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingInterval = null;
let seconds = 0;

// Reset UI to initial state
function resetUI() {
  actionButton.className = "btn primary";
  buttonText.textContent = "Start Recording";
  
  screenVideo.srcObject = null;
  screenVideo.style.display = "none";
  
  placeholder.style.display = "flex";
  
  timer.style.display = "none";
  recordingTime.textContent = "00:00";
  
  statusBadge.className = "status";
  statusText.textContent = "Ready";
  
  isRecording = false;
  seconds = 0;
}

// Set UI to recording state
function setRecordingUI() {
  actionButton.className = "btn primary recording";
  buttonText.textContent = "Stop Recording";
  
  screenVideo.style.display = "block";
  placeholder.style.display = "none";
  
  timer.style.display = "flex";
  recordingTime.textContent = "00:00";
  
  statusBadge.className = "status recording";
  statusText.textContent = "Recording";
  
  isRecording = true;
  seconds = 0;
}

actionButton.addEventListener("click", async () => {
  if (!isRecording) {
    try {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 60 } },
        audio: true,
      });
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
  screenVideo.srcObject = mediaStream;
  screenVideo.muted = true;
  
  setRecordingUI();
  
  // Listen for track ended events (user clicks browser "Stop Sharing" button)
  mediaStream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => {
      console.log("Track ended by user via browser UI");
      handleStreamEnded();
    });
  });
  
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: "video/webm;codecs=vp9",
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    // Auto download when recording has data
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      
      // Auto download
      const a = document.createElement("a");
      a.href = url;
      a.download = `screen-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      
      console.log("Recording downloaded automatically");
    } else {
      console.log("No data recorded");
    }
    
    // Clean up stream
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  };

  mediaRecorder.start();
  startTimer();
}

// Handle when user stops sharing via browser UI
function handleStreamEnded() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  
  stopTimer();
  resetUI();
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  
  stopTimer();
  resetUI();
  
  // Stop all tracks
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
}

function updateTimer() {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  recordingTime.textContent = `${mins}:${secs}`;
}

function startTimer() {
  recordingInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(recordingInterval);
  seconds = 0;
}

window.addEventListener("beforeunload", () => {
  if (isRecording) {
    stopRecording();
  }
});