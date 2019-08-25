import React, { Component } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CalendarList } from "react-native-calendars";
import { ActionSheet } from "teaset";

const SELECTED_COLOR = "lightgreen";
const CALENDAR_WIDTH = 360;

const BEFORE_NOON = 1;
const AFTER_NOON = 2;
const ALL_DAY = 3;

class HalfdayCalendar extends Component {
  constructor(props) {
    super();
    const startDate = props.startDate || null;
    const endDate = props.endDate || null;
    const startDateIsHalf = props.startDateIsHalf || ALL_DAY;
    const endDateIsHalf = props.endDateIsHalf || ALL_DAY;

    this.state = {
      selectStarted: false,
      startDate,
      endDate,
      startDateIsHalf,
      endDateIsHalf,
      markedDates: startDate
        ? this.getMarkedDates(
            startDate,
            endDate,
            startDateIsHalf,
            endDateIsHalf
          )
        : {},
      showCalendar: false
    };
  }

  // =-========== Related Range Calendar

  /**
   * Handle the process when the user clicked a day in the calendar
   */

  selectDate = async day => {
    // if a user clicks the same date, then clear selection
    if (
      this.state.startDate == day.dateString ||
      this.state.endDate == day.dateString
    ) {
      await this.setState({
        markedDates: {},
        startDate: null,
        endDate: null,
        startDateIsHalf: ALL_DAY,
        endDateIsHalf: ALL_DAY
      });
      return;
    }

    // In case when the user chose the both of startDate and endDate
    if (this.state.startDate && this.state.endDate) {
      this.selectDateWithNoon(day, "NONE");
    } else {
      // We need to show the popover to ask the user select "All day, Before Noon, Afternoon"
      ActionSheet.hide();
      ActionSheet.show(
        [
          {
            title: "All day",
            onPress: () => this.selectDateWithNoon(day, ALL_DAY)
          },
          {
            title: "Before noon",
            onPress: () => this.selectDateWithNoon(day, BEFORE_NOON)
          },
          {
            title: "After noon",
            onPress: () => this.selectDateWithNoon(day, AFTER_NOON)
          }
        ],
        {
          title: "Cancel"
        }
      );
    }
  };

  /**
   * After a user chose one of items(All day, beforenoon, afternoon)
   */
  selectDateWithNoon = async (day, noon) => {
    const date = day.dateString;
    let markedDates = {};

    // If startDate is null, it means that he didn't choose any day yet.
    // So we need to select a start day here.
    if (this.state.startDate === null) {
      // If the user selected "Before noon" of startdate,
      // it means All day in same aspect.
      await this.setState({
        startDate: date,
        startDateIsHalf: noon
      });
      markedDates[`${date}`] = {
        startingDay: true,
        endingDay: true,
        selected: true,
        color: SELECTED_COLOR,
        textColor: "black",
        customStyles: this.getCustomStyles(true, true, noon !== ALL_DAY, noon)
      };
    } else if (this.state.endDate === null) {
      // Ex: If the user selected 21 and then 13 in the calendar
      if (new Date(date) < new Date(this.state.startDate)) {
        await this.setState({
          startDate: date,
          endDate: this.state.startDate,
          startDateIsHalf: noon,
          endDateIsHalf: this.state.startDateIsHalf
        });
      } else {
        // Ex: If the user selected 13 and then 20 in the calendar

        await this.setState({
          endDate: date,
          endDateIsHalf: noon
        });
      }
      markedDates = this.getMarkedDates(
        this.state.startDate,
        this.state.endDate,
        this.state.startDateIsHalf,
        this.state.endDateIsHalf
      );
    } else {
      await this.setState({
        startDate: null,
        endDate: null,
        startDateIsHalf: ALL_DAY,
        endDateIsHalf: ALL_DAY
      });
    }

    await this.setState({ markedDates: markedDates });
  };

  /**
   * Get the dates to be marked in Calendar
   * Params:
   *  startDate, endDate, startDateIsHalf, endDateIsHalf
   *  Where startDateIsHalf means that a user chose the startDate's afternoon
   *  And endDateIsHaf means that a user chose the endDate's beforenoon
   * Return:
   *  Object-array including customStyles
   *    selected: true, color, startingDay: true/false, endingDay: true/false
   *    customStyles: refer to the method 'getCustomStyles'
   *
   */
  getMarkedDates = (startDate, endDate, startDateIsHalf, endDateIsHalf) => {
    const date1 = Math.min(new Date(startDate), new Date(endDate || startDate));
    const date2 = Math.max(new Date(startDate), new Date(endDate || startDate));
    let _date = 0;
    let index = 0;
    let markedDates = {};
    let isStart = false,
      isEnd = false;

    while (true) {
      _date = new Date(date1 + 1000 * 3600 * 24 * index);
      isStart = index === 0;
      isEnd = _date >= date2;
      let customStyles;
      if (isStart) {
        customStyles = this.getCustomStyles(
          true,
          isEnd,
          isEnd ? startDateIsHalf !== ALL_DAY : startDateIsHalf === AFTER_NOON,
          startDateIsHalf
        );
      } else if (isEnd) {
        customStyles = this.getCustomStyles(
          isStart,
          true,
          endDateIsHalf === BEFORE_NOON,
          endDateIsHalf,
          index === 1 && isEnd
        );
      } else {
        customStyles = this.getCustomStyles(false, false, false);
      }

      markedDates[`${_date.toISOString().substr(0, 10)}`] = {
        selected: true,
        startingDay: isStart,
        endingDay: isEnd,
        customStyles: customStyles
      };
      index++;
      if (_date >= date2) break;
    }
    return markedDates;
  };

  getCustomStyles = (
    isStart,
    isEnd,
    isHalf = true,
    noon = BEFORE_NOON,
    isWideLeft = false
  ) => {
    const isBeforeNoon = noon == BEFORE_NOON ? true : false;
    const triangleRightTop = {
      borderBottomWidth: 32,
      borderBottomColor: SELECTED_COLOR,
      borderLeftWidth: 32,
      borderLeftColor: "white"
    };
    const triangleLeftBottom = {
      borderTopWidth: 32,
      borderTopColor: SELECTED_COLOR,
      borderRightWidth: 32,
      borderRightColor: "white"
    };
    return {
      container: {
        backgroundColor: SELECTED_COLOR,
        height: 32,
        width: !isStart && !isEnd ? "150%" : 32,
        ...(isWideLeft ? { width: "150%", left: -19 } : {}),
        zIndex: isStart ? 3 : isEnd ? 2 : 1,
        alignItems: isStart
          ? !isHalf
            ? "center"
            : "flex-start"
          : isEnd
          ? !isHalf
            ? "center"
            : "flex-end"
          : "center",
        borderRadius: 0,
        borderTopLeftRadius: isStart ? (isHalf ? 0 : 30) : 0,
        borderBottomLeftRadius: isStart ? (isHalf ? 0 : 30) : 0,
        borderTopRightRadius: isEnd ? (isHalf ? 0 : 30) : 0,
        borderBottomRightRadius: isEnd ? (isHalf ? 0 : 30) : 0
      },
      text: isStart
        ? isHalf
          ? {
              position: "absolute",
              top: -4,
              left: 0,
              lineHeight: 32,
              textAlign: "center",
              width: 0,
              height: 0,
              ...(isBeforeNoon ? triangleLeftBottom : triangleRightTop)
            }
          : {
              position: "absolute",
              top: -5,
              lineHeight: 32,
              textAlign: "center"
            }
        : isEnd
        ? isHalf
          ? {
              position: "absolute",
              top: -4,
              lineHeight: 32,
              textAlign: "center",
              width: 0,
              height: 0,
              ...triangleLeftBottom
            }
          : {
              position: "absolute",
              top: -5,
              ...(isWideLeft ? {left: 45} : {}),
              lineHeight: 32,
              textAlign: "center"
            }
        : {
            position: "absolute",
            top: -5,
            lineHeight: 32,
            height: 34,
            textAlign: "center"
          }
    };
  };

  confirm = () => {
    const { startDate, endDate, startDateIsHalf, endDateIsHalf } = this.state;
    this.props.onConfirm &&
      this.props.onConfirm(
        startDate,
        endDate || startDate,
        startDateIsHalf,
        endDateIsHalf || startDateIsHalf
      );
  };
  // =-========== Related Range Calendar : end

  render() {
    return (
      <View
        style={{
          position: "absolute",
          zIndex: 10000,
          backgroundColor: "white",
          flex: 1,
          height: "100%",
          width: "100%",
          flexDirection: "row",
          justifyContent: "center"
        }}
      >
        <CalendarList
          _calendarWidth={CALENDAR_WIDTH}
          // onLayout={(event)=>alert(event.nativeEvent.layout.width)}
          onDayPress={day => this.selectDate(day)}
          style={{ marginBottom: 40 }}
          // Max amount of months allowed to scroll to the past. Default = 50
          pastScrollRange={50}
          // Max amount of months allowed to scroll to the future. Default = 50
          futureScrollRange={50}
          // Enable or disable scrolling of calendar list
          scrollEnabled={true}
          // Enable or disable vertical scroll indicator. Default = false
          showScrollIndicator={true}
          markedDates={this.state.markedDates}
          markingType={"custom"}
          theme={{
            "stylesheet.day.custom": {
              base: {
                overflow: "hidden",
                height: 34,
                alignItems: "center",
                width: 36
              }
            }
          }}
        />

        <View
          style={{
            position: "absolute",
            bottom: 0,
            height: 35,
            width: "100%",
            flexDirection: "row"
          }}
        >
          <TouchableOpacity
            onPress={() => this.confirm()}
            style={{
              width: "50%",
              height: 35,
              alignItems: "center",
              backgroundColor: "green"
            }}
          >
            <Text style={{ color: "white", lineHeight: 33 }}>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.props.onCancel && this.props.onCancel()}
            style={{
              width: "50%",
              height: 35,
              alignItems: "center",
              borderColor: "green",
              borderWidth: 1
            }}
          >
            <Text style={{ lineHeight: 33 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default HalfdayCalendar;
