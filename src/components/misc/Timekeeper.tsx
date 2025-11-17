import { button, useControls } from "leva";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import useAppStore from "../../stores/useAppStore";

function UseControlsContainer() {
  const hourRef = useRef(0);
  const minuteRef = useRef(0);
  const secondRef = useRef(0);

  useControls({
    hour: {
      value: 0,
      step: 1,
      min: 0,
      max: 23,
      onChange: (v) => (hourRef.current = v),
    },
    minute: {
      value: 0,
      step: 1,
      min: 0,
      max: 59,
      onChange: (v) => (minuteRef.current = v),
    },
    second: {
      value: 0,
      step: 1,
      min: 0,
      max: 59,
      onChange: (v) => (secondRef.current = v),
    },
    setTimeToCurrentInputs: button(() => {
      const now = DateTime.now();
      const targetTime = DateTime.fromObject({
        hour: hourRef.current,
        minute: minuteRef.current,
        second: secondRef.current,
      });
      const offset = targetTime.diff(now, "milliseconds").milliseconds;
      useAppStore.setState({ timeOffsetMs: offset });
    }),
    resetTimeOffset: button(() => useAppStore.setState({ timeOffsetMs: 0 })),
  });
  return null;
}

export default function Timekeeper() {
  const debug = useAppStore((state) => state.debug);
  const timeOffsetMs = useAppStore((state) => state.timeOffsetMs);

  useEffect(() => {
    useAppStore.setState({
      currentTimeValue: DateTime.now().plus({ milliseconds: timeOffsetMs }),
    });
  }, [timeOffsetMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.setState({
        currentTimeValue: DateTime.now().plus({ milliseconds: timeOffsetMs }),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeOffsetMs]);

  return <>{debug && <UseControlsContainer />}</>;
}
