const form = document.querySelector("#conversion-form");
const urlInput = document.querySelector("#media-url");
const convertButton = document.querySelector("#convert-button");
const progress = document.querySelector("#progress");
const result = document.querySelector("#result");
const errorMessage = document.querySelector("#error");
const downloadLink = document.querySelector("#download-link");

let currentDownloadUrl;

const initialUrl = new URLSearchParams(window.location.search).get("url");
if (initialUrl) urlInput.value = initialUrl;
urlInput.focus();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearResult();
  setConverting(true);

  try {
    const response = await fetch("/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtube_url: urlInput.value.trim() }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Não foi possível converter este link.");
    }

    const audio = await response.blob();
    const title = decodeTitle(response.headers.get("X-Audio-Title"));
    currentDownloadUrl = URL.createObjectURL(audio);
    downloadLink.href = currentDownloadUrl;
    downloadLink.download = `${sanitizeFileName(title)}.mp3`;
    downloadLink.textContent = `Salvar ${downloadLink.download}`;
    result.classList.remove("hidden");
  } catch (error) {
    errorMessage.textContent =
      error instanceof Error ? error.message : "Não foi possível converter.";
    errorMessage.classList.remove("hidden");
  } finally {
    setConverting(false);
  }
});

function setConverting(converting) {
  convertButton.disabled = converting;
  convertButton.textContent = converting ? "Convertendo..." : "Converter para MP3";
  progress.classList.toggle("hidden", !converting);
}

function clearResult() {
  errorMessage.classList.add("hidden");
  result.classList.add("hidden");
  if (currentDownloadUrl) URL.revokeObjectURL(currentDownloadUrl);
  currentDownloadUrl = undefined;
}

function decodeTitle(value) {
  if (!value) return "audio-youtube";
  try {
    return decodeURIComponent(value);
  } catch {
    return "audio-youtube";
  }
}

function sanitizeFileName(value) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 100) || "audio-youtube"
  );
}
