import React, { useState } from "react";
import { TextField, Button } from "@material-ui/core";

export const Testing = () => {
  const [items, setItems] = useState([""]);
  const [prices, setPrices] = useState([""]);

  const handleItemText = index => e => {
    e.preventDefault();
    let items_arr = [...items];
    items_arr[index] = e.target.value;
    setItems(items_arr);
  };
  const handlePriceText = i => e => {
    e.preventDefault();
    let prices_arr = [...prices];
    prices_arr[i] = e.target.value;
    setPrices(prices_arr);
  };
  const handleDelete = index => e => {
    e.preventDefault();
    let items_arr = [...items.slice(0, index), ...items.slice(index + 1)];
    let prices_arr = [...prices.slice(0, index), ...items.slice(index + 1)];
    setItems(items_arr);
    setPrices(prices_arr);
  };
  const addItem = e => {
    e.preventDefault();
    let items_arr = items.concat([""]);
    let prices_arr = prices.concat([""]);
    setItems(items_arr);
    setPrices(prices_arr);
  };

  return (
    <>
      {items.map((item, index) => (
        <div
          id={`item-${index}`}
          style={{
            marginTop: "1rem",
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center"
          }}
        >
          <span
            key={index}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <TextField
              type="text"
              label={`item-${index}`}
              variant="outlined"
              onChange={handleItemText(index)}
              value={item}
            />
            <TextField
              type="text"
              label={`price-item-${index}`}
              variant="outlined"
              onChange={handlePriceText(index)}
              value={prices[index]}
            />
          </span>
          <div style={{ margin: "1rem" }}></div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDelete(index)}
            >
              del
            </Button>
            <Button variant="contained" color="primary" onClick={addItem}>
              add
            </Button>
          </div>
        </div>
      ))}
    </>
  );
};
