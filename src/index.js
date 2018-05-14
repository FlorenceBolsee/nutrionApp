import ReactDOM from 'react-dom';
import React, { Component } from "react";

import BillboardChart from "react-billboardjs";

let pieData = [];
let barData = [];

class TodoApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      foodName: '',
      kcal: '',
      sugar: '',
      pieChart: {
        columns: []
      },
      barStyle: {
        height: '600px'
      },
      barChart: {
        x: "x",
        columns: [
          ['x'],
          ['Nutrients']
        ]
      },
      barAxis: {
        x: {
          type: "category",
          tick: {
            rotate: 80,
            multiline: false,
            tooltip: true
          }
        },
        y: {
          label: "per 100g",
          tick: {
            format: function(x) {
			         return x + 'mg';
            }
          }
        }
      },
      search: '',
      searchResult: [],
      api_key: 'G501NfLnQxfmp0cEHR0A31eViyjSj9Vvr2aBTQZI',
      ndbno: '09003',
      newSearchFound: false,
      loader: '',
      nutrientsList: [
        "Protein", "Carbohydrate, by difference", "Total lipid (fat)", "Fiber, total dietary", "Water"
      ]
    }
  }

  handleChange = (event) => {
  	let self = this;
    let result;
    self.setState({
      search: event.target.value,
    }, () => {
      for(let i = 0; i < self.state.searchResult.length; i++){
        if(self.state.searchResult[i].name === self.state.search){
          self.setState({
            ndbno: self.state.searchResult[i].ndbno
          }, () => {
            this.newSearch();
          });
        }
      }
      axios.get('https://api.nal.usda.gov/ndb/search/?format=json', {
        params: {
            api_key: self.state.api_key,
            q: self.state.search,
            max: 50,
            ds: 'Standard Reference',
          }
      })
      .then((response) => {
          if(response.data.list){
            result = response.data.list.item;
            self.setState({
              searchResult: result
            });
          }
      })
      .catch((response) => {
          console.log(response);
      });
    });
  }

  newSearch = () => {
    let self = this;
    self.setState({
      foodName: '',
      kcal: '',
      loader: ''
    }, () => {
      axios.get('https://api.nal.usda.gov/ndb/reports/?', {
      	params: {
        		api_key: self.state.api_key,
            ndbno: self.state.ndbno,
        	}
      })
      .then((response) => {
          const nutrients = response.data.report.food.nutrients;
          const nutrientsList = self.state.nutrientsList;
          console.log(nutrients);
          pieData = [];
          barData = [
            ['x'],
            ['Nutrients']
          ];
          console.log(barData);
          let lastKey = 0;
          let total = 100;
          let sugar;
          for(let i = 0; i < nutrients.length; i++){
            if(nutrients[i].unit === "mg" && parseFloat(nutrients[i].value) > 0){
              barData[0].push(nutrients[i].name);
              barData[1].push(parseFloat(nutrients[i].value));
              console.log(barData);
            }
            for(let u = 0; u < nutrientsList.length; u++){
              if(nutrients[i].name === "Sugars, total" && parseFloat(nutrients[i].value) > 0){
                sugar = parseFloat(nutrients[i].value);
              }
              if(nutrientsList[u] === nutrients[i].name){
                if(nutrients[i].unit === "g" && parseFloat(nutrients[i].value) > 0){
                	let value;
                	value = parseFloat(nutrients[i].value);
                  if((total - value) > 0){
                    pieData.push([
                      nutrients[i].name, value
                    ]);
                    total = total - value;
                  }
                }
              }
            }
          }
          pieData.push([
            "Other", total
          ]);
          console.log(barData);
          self.setState({
            foodName: response.data.report.food.name,
            kcal: nutrients[0].value,
            sugar: sugar,
            pieChart: {
              columns: pieData,
              type: "pie"
            },
            barChart: {
              x: "x",
              columns: barData,
              type: "bar"
            },
            loader: 'hidden'
          });
      })
      .catch((response) => {
      		console.log(response);
      });
    });
  }

  handleClassName = () => {
    if(this.state.loader !== "hidden"){
      return "hidden";
    }
  }

  componentDidMount() {
  	this.newSearch();
  }

  sugarRender() {
    if(this.state.sugar === undefined || this.state.loader !== "hidden"){
      return "hidden";
    }
  }

  render() {
    return (
      <div className="foodContainer">
        <label>
          Type some food:
          <input id="search" type="text" value={this.state.search} onChange={this.handleChange} list="searchResults" />
        </label>
        <datalist id="searchResults">
          {this.state.searchResult.map((item, i) =>
            <option key={i} value={item.name}></option>
          )}
        </datalist>
        <h1>{this.state.foodName}</h1>
        <strong className={this.handleClassName()}>{this.state.kcal + 'kcal / 100g'}</strong>
        <strong className={this.sugarRender()}>{'Sugars Per 100g: ' + this.state.sugar + 'g'}</strong>
        <BillboardChart unloadBeforeLoad className={this.handleClassName()} data={this.state.pieChart} />
        <BillboardChart unloadBeforeLoad style={this.state.barStyle} className={this.handleClassName() + ' barChart'} data={this.state.barChart} axis={this.state.barAxis} />
        <img className={this.state.loader} src="https://loading.io/spinners/recycle/lg.recycle-spinner.gif"/>
      </div>
    )
  }
}

ReactDOM.render(<TodoApp />, document.querySelector("#app"))
