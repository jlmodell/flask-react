import React, { useState, useRef, useEffect } from "react";
import { navigate } from "@reach/router";
import { TextField } from "@material-ui/core";
import axios from "axios";

export const HelenFile = () => {
  const [date, setDate] = useState("2019-10-31");
  const [file, setFile] = useState("");
  const [email, setEmail] = useState("");
  const [fname, setFname] = useState("");

  useEffect(() => {
    if (fname) {
      navigate("/helen_success", { state: { filename: fname } });
    }
  }, [fname]);

  const handleSubmit = async e => {
    e.preventDefault();

    let formData = new FormData();

    let xlFile = document.querySelector("#file");

    formData.set("date", date);
    formData.set("email", email);
    formData.append("file", xlFile.files[0]);

    let config = {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    };

    try {
      // let response = await axios.get("/api/helen_file");
      let response = await axios.post("api/helen_file", formData, config);
      setFname(response.data.result);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={container}>
      <form
        style={helenFileCss}
        action="/helen_success"
        method="POST"
        // encType="multipart/form-data"
        onSubmit={handleSubmit}
      >
        <TextField
          type="date"
          // defaultValue="2019-10-31"
          value={date}
          onChange={e => setDate(e.target.value)}
          label="Date"
          name="date"
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required={true}
          fullWidth
          variant="outlined"
        />
        <TextField
          type="file"
          id="file"
          label="File"
          name="file"
          value={file}
          onChange={e => setFile(e.target.value)}
          margin="normal"
          required={true}
          fullWidth
          variant="outlined"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="text"
          multiline
          label="Email(s) 'comma' to separate.(optional)"
          name="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          margin="normal"
          fullWidth
          variant="outlined"
          InputLabelProps={{ shrink: true }}
        />
        <div style={spacer}></div>
        <TextField type="submit" fullWidth variant="outlined" />
      </form>
    </div>
  );
};

export const HelenSuccess = props => {
  const file_ext = useRef();

  let filename = props.location.state.filename || "test.xlsx";

  const download = async () => {
    let responseType = {
      responseType: "arraybuffer"
    };

    try {
      let response = await axios.get("/download/" + filename, responseType);
      let blob = new Blob([response.data], {
        type: response.headers["content-type"]
      });
      let ref = file_ext;
      ref.current.href = URL.createObjectURL(blob);
      ref.current.download = filename;
      ref.current.click();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={container}>
      <h1>Success {filename}</h1>
      <div>
        <p>
          Download file:{" "}
          <a style={{ display: "none" }} href="empty" ref={file_ext}>
            ref
          </a>
          <button onClick={download}>{filename}</button>
        </p>
      </div>
    </div>
  );
};

const container = {
  margin: "2rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center"
};
const helenFileCss = {
  display: "flex",
  flexWrap: "wrap",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  width: "80%"
};
const spacer = {
  marginTop: "1rem",
  marginBottom: "1rem"
};
