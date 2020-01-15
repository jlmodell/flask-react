import React, { useState, useRef, useEffect } from "react";
import { navigate } from "@reach/router";
import { TextField } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";

export const HelenFile = () => {
  const classes = useStyles();
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState("");
  const [email, setEmail] = useState("");
  const [fname, setFname] = useState("");
  // const [job, setJob] = useState("");

  useEffect(() => {
    if (fname) {
      navigate("/helen_success", { state: { filename: fname } });
    }
  }, [fname]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

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
      // setJob(response.data.job_key);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
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
        {loading ? (
          <div className={classes.root}>
            <CircularProgress size={60} />
          </div>
        ) : (
            <TextField type="submit" fullWidth variant="outlined" />
          )}
      </form>
    </div>
  );
};

export const HelenSuccess = props => {
  const file_ext = useRef();
  // const [queued, setQeueued] = useState(true);
  const [filename] = useState(props.location.state.filename || "text.xlsx")
  // const [jobKey, setJobKey] = useState(props.location.state.jobKey || "job.key")

  // let filename = props.location.state.filename || "test.xlsx";
  // let jobKey = props.location.state.jobKey || "job key"

  // useEffect(() => {
  //   if (queued) {
  //     let response = axios.get("results/" + jobKey)
  //     if (response.status == 200) {
  //       setQeueued(false)
  //       setFilename(response.data.filename)
  //     } else {
  //       setJobKey(response.data.taskid)
  //     }

  //   }
  // }, [])

  // const handleButtonClick = async () => {
  //   let response = await axios.get("results/" + jobKey)
  //   if (response.status == 200) {
  //     setQeueued(false)
  //   } else {
  //     setJobKey(response.data.taskid)
  //   }
  // }

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

  // let queue_message = (
  //   <>
  //     <h1>Result</h1>
  //     <div>
  //       <p>
  //         {jobKey} is still being processed.
  //         <button onClick={handleButtonClick}>Update</button>
  //       </p>
  //     </div>
  //   </>
  // )

  let success_message = (
    <>
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
    </>
  )

  return (
    <div style={container}>
      {/* {queued && queue_message} */}
      {success_message}
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

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    "& > * + *": {
      marginLeft: theme.spacing(2)
    }
  }
}));