import React, { useState, useEffect, useRef } from "react";
import { navigate } from "@reach/router";
import { TextField, Checkbox, FormControlLabel } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";

let now = new Date();

export const Bic = () => {
  const classes = useStyles();
  const [date, setDate] = useState(now.toISOString().substring(0, 10));
  const [checked, setChecked] = useState(false);
  const [po, setPO] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState("");
  const [bicFile, setBicFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [excel, setExcel] = useState("");

  useEffect(() => {
    if (excel) {
      console.log(excel);
      navigate("/bic_success", { state: { filename: excel } });
    }
  }, [excel]);

  const handleSubmit = async e => {
    e.preventDefault();

    setLoading(true);

    let formData = new FormData();

    let xlFile = document.querySelector("#file");
    let bicXlFile = document.querySelector("#bicFile");

    formData.set("date", date);
    formData.set("po", po);
    formData.set("email", email);
    formData.append("file", xlFile.files[0]);
    formData.append("bicFile", bicXlFile.files[0]);

    let config = {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    };

    try {
      let response = await axios.post("api/bic", formData, config);
      setExcel(response.data.result);
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
        action="/bic_success"
        onSubmit={handleSubmit}
      >
        <FormControlLabel
          control={
            <Checkbox checked={checked} onChange={() => setChecked(!checked)} />
          }
          label="Update BIC in Progress"
        />

        <TextField
          type="date"
          name="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          variant="outlined"
          label="Date"
          required={true}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
        />
        <TextField
          type="text"
          name="po"
          value={po}
          onChange={e => setPO(e.target.value)}
          variant="outlined"
          label="Purchase Order #"
          required={true}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
        />
        <TextField
          type="file"
          name="file"
          id="file"
          value={file}
          onChange={e => setFile(e.target.value)}
          variant="outlined"
          label="Release Schedule.xls"
          required={true}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
        />
        {checked && (
          <TextField
            type="file"
            name="bicFile"
            id="bicFile"
            value={bicFile}
            onChange={e => setBicFile(e.target.value)}
            variant="outlined"
            label="BIC File in Progress"
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
          />
        )}
        <TextField
          type="text"
          name="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          variant="outlined"
          label="Email (optional) - separate with commas "
          required={true}
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

export const BicSuccess = props => {
  const file_ext = useRef();

  let filename = props.location.state.filename || "test.xlsx";

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
