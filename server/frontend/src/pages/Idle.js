import React, { useState, useEffect, useRef } from "react";
import { navigate } from "@reach/router";
import { TextField } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";

export const Idle = () => {
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState({
        file: "",
        email: "",
        wage: "13",
        excel: "",
        html: "",
        sum_idle: "",
        proj_annual: "",
    })

    useEffect(() => {
        if (values.excel) {
            navigate("/idle_success", { state: { filename: values.excel, html: values.html, sum_idle: values.sum_idle, proj_annual: values.proj_annual } });
        }
    }, [values.excel, values.html, values.sum_idle, values.proj_annual]);

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);

        let formData = new FormData();

        formData.set("email", values.email);
        formData.set("wage", values.wage)

        if (values.file) {
            let xlFile = document.querySelector("#file");
            formData.append("file", xlFile.files[0]);
        }

        let config = {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        };

        try {
            let response = await axios.post("/api/idle", formData, config);
            setValues({ ...values, excel: response.data.result, html: response.data.html, sum_idle: response.data.sum_idle, proj_annual: response.data.proj_annual });
            setLoading(false);
        } catch (err) {
            console.log(err);
            setLoading(false);
        }
    };

    const handleChange = e => {
        const { name, value } = e.target
        setValues({ ...values, [name]: value })
    }

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
                    value={values.file}
                    onChange={handleChange}
                    variant="outlined"
                    label="Production Report (XX-XX-XX.xls)"
                    required={true}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    type="text"
                    name="wage"
                    value={values.wage}
                    onChange={handleChange}
                    variant="outlined"
                    label="Minimum Wage for projections"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    type="text"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
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

export const IdleSuccess = props => {
    const file_ext = useRef();

    let filename = props.location.state.filename || "test.xlsx";

    const { html, sum_idle, proj_annual } = props.location.state

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
                <div dangerouslySetInnerHTML={{ __html: html }} />
                <p>Sum Daily Idle Cost = {sum_idle}</p>
                <p><i>Projected Annual Cost = {proj_annual}</i></p>
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
