import React, { useState, useEffect, useRef } from "react";
import { navigate } from "@reach/router";
import { TextField } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";

export const Planning = () => {
  const classes = useStyles();
  const [file, setFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [excel, setExcel] = useState("");
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (excel) {
      navigate("/planning_success", { state: { filename: excel, html: html } });
    }
  }, [excel, html]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    let formData = new FormData();

    let xlFile = document.querySelector("#file");

    formData.set("email", email);
    formData.append("file", xlFile.files[0]);

    let config = {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    };

    try {
      let response = await axios.post("/api/planning", formData, config);
      setExcel(response.data.result);
      setHtml(response.data.html);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <form
        style={css}
        method="POST"
        action="/planning_success"
        onSubmit={handleSubmit}
      >
        <TextField
          type="file"
          name="file"
          id="file"
          value={file}
          onChange={e => setFile(e.target.value)}
          variant="outlined"
          label="planningsocustkit.csv *no headers*"
          required={true}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
        />
        <TextField
          type="text"
          name="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          variant="outlined"
          label="Email (optional) - separate with commas "
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
        />
        <div style={spacer} />
        {loading ? (
          <div className={classes.root}>
            <CircularProgress size={60} />
          </div>
        ) : (
          <TextField type="submit" fullWidth variant="outlined" />
        )}

        <div style={spacer} />
      </form>
    </div>
  );
};

export const PlanningSuccess = props => {
  const file_ext = useRef();

  let filename = props.location.state.filename || "test.xlsx";
  const Html = props.location.state.html;

  const download = async () => {
    let responseType = {
      responseType: "arraybuffer"
    };

    try {
      let response = await axios.get("download/" + filename, responseType);
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
        <div dangerouslySetInnerHTML={{ __html: Html }} />
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
const css = {
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

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    "& > * + *": {
      marginLeft: theme.spacing(2)
    }
  }
}));
