import { AdhdFile } from "../types";

export async function createFile(
  markdown: string
): Promise<{ parent: string }> {
  const response = await fetch("http://localhost:8080/file", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ markdown: markdown }),
  });

  return await response.json();
}

export function editFile(id: string, markdown: string) {
  fetch(`http://localhost:8080/file/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ markdown: markdown }),
  });
}

export function createFolder(name: string, parentId: string | null) {
  fetch("http://localhost:8080/folder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parentId: parentId, name: name }),
  });
}

export async function getFiles(id: string | null): Promise<AdhdFile[]> {
  console.log(id);
  if (id) {
    const response = await fetch(`http://localhost:8080/files?parent=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  } else {
    const response = await fetch(`http://localhost:8080/files`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }
}

export async function getFile(id: string): Promise<AdhdFile> {
  if (id === "") {
    return { id: "", markdown: "", parentId: "", name: "Home" };
  }
  const response = await fetch(`http://localhost:8080/file/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function triggerFileDownload(markdown: string) {
  const pdfResponse = await fetch("http://localhost:5000/convert-to-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ markdown: markdown }),
  });
  // return file to user?
  const pdfBlob = await pdfResponse.blob();
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = "converted_file.pdf";
  document.body.appendChild(a);
  a.click();
}
