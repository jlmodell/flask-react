import React, { useRef } from "react";
import axios from "axios";
// import { Link } from "@reach/router";

export function HelenSuccess() {
  const file_ext = useRef();

  const filename = window.filename;

  const download = () => {
    axios
      .get(`/download/${filename}`, { responseType: "arraybuffer" })
      .then(res => {
        let blob = new Blob([res.data], {
          type: res.headers["content-type"]
        });
        let ref = file_ext;
        ref.current.href = URL.createObjectURL(blob);
        ref.current.download = `${filename}`;
        ref.current.click();
      });
  };

  return (
    <div>
      <h1>Success (react)</h1>
      <div>
        <p>
          Download file:{" "}
          <a style={{ display: "none" }} href="empty" ref={file_ext}>
            ref
          </a>
          <button onClick={download}>{filename || "test.xlsx"}</button>
        </p>
      </div>
    </div>
  );
}
