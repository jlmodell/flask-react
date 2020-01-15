import React, { useState, useRef, useEffect } from "react";
import { navigate } from "@reach/router";
import { TextField, Chip, FormControl, CircularProgress, InputLabel, Select, Input, MenuItem } from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import axios from "axios";

export const Tracings = () => {
    const classes = useStyles();
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [months, setMonths] = useState([]);
    const [item, setItem] = useState("");
    const [html, setHtml] = useState("");
    const [fname, setFname] = useState("");

    useEffect(() => {
        if (fname) {
            navigate("/tracings_success", { state: { filename: fname, html: html } });
        }
    }, [fname, html]);

    const monthSelectors = [
        "December 2018",
        "January 2019",
        "February 2019",
        "March 2019",
        "April 2019",
        "May 2019",
        "June 2019",
        "July 2019",
        "August 2019",
        "September 2019",
        "October 2019",
        "November 2019",
        // "December 2019",
        // "January 2020",
        // "February 2020",
    ]


    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    };

    function getStyles(month, months, theme) {
        return {
            fontWeight:
                months.indexOf(month) === -1
                    ? theme.typography.fontWeightRegular
                    : theme.typography.fontWeightMedium,
        };
    }

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);

        let formData = new FormData();

        formData.set("item", item);
        formData.set("months", months);
        formData.set("email", email);
        // formData.append("file", xlFile.files[0]);

        let config = {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        };

        try {
            let response = await axios.post("api/tracings", formData, config);
            setFname(response.data.result);     
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
                style={helenFileCss}
                action="/tracings_success"
                method="POST"
                onSubmit={handleSubmit}
            >                
                <TextField
                    type="text"
                    multiline
                    label="Item (same format as ROI)"
                    name="item"
                    value={item}
                    onChange={e => setItem(e.target.value)}
                    margin="normal"
                    fullWidth
                    variant="outlined"
                    required="true"
                    InputLabelProps={{ shrink: true }}
                />
                <FormControl className={classes.formControl}>
                    <InputLabel id="demo-mutiple-chip-label">Month(s)</InputLabel>
                    <Select
                        labelId="months"
                        id="months-mutiple-chip"
                        multiple
                        value={months}
                        onChange={e => setMonths(e.target.value)}
                        input={<Input id="select-multiple-chip" />}
                        renderValue={selected => (
                            <div className={classes.chips}>
                                {selected.map(value => (
                                    <Chip key={value} label={value} className={classes.chip} />
                                ))}
                            </div>
                        )}
                        MenuProps={MenuProps}
                    >
                        {monthSelectors.map(month => (
                            <MenuItem key={month} value={month} style={getStyles(month, months, theme)}>
                                {month}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
                {/* <button onClick={() => console.log(months)}>click me test</button> */}
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

export const TracingsSuccess = props => {
    const file_ext = useRef();    
    const [filename] = useState(props.location.state.filename || "text.xlsx")
    const Html = props.location.state.html;

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
                <div dangerouslySetInnerHTML={{ __html: Html }} />
            </div>
        </>
    )

    return (
        <div style={container}>            
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
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 300,
        maxWidth: 512,
    },
    chips: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    chip: {
        margin: 2,
    },
}));



/*

                <TextField
                    type="text"
                    multiline
                    label="Month(s) 'comma' to separate."
                    name="months"
                    value={months}
                    onChange={e => setMonths(e.target.value)}
                    margin="normal"
                    fullWidth
                    variant="outlined"
                    required="true"
                    InputLabelProps={{ shrink: true }}
                />

*/