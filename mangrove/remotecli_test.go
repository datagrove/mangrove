package mangrove

import (
	"reflect"
	"testing"
)

// const test1 = "myProgram -option1 \"value with spaces\" -option2=value2 argument1 \"argument 2\""
func TestMain(t *testing.T) {
	testCases := []struct {
		name        string
		cmdString   string
		expectedRes []string
	}{
		{
			name:        "quoted strings as arguments",
			cmdString:   `myProgram -option1 "value with spaces" -option2=value2 argument1 "argument 2"`,
			expectedRes: []string{"myProgram", "-option1", "value with spaces", "-option2=value2", "argument1", "argument 2"},
		}, {
			name:        "simple command",
			cmdString:   "myProgram -option1 value1 -option2 value2 argument1 argument2",
			expectedRes: []string{"myProgram", "-option1", "value1", "-option2", "value2", "argument1", "argument2"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			r, e := runtime_args(tc.cmdString)
			if e != nil {
				t.Errorf("Unexpected error: %v", e)
			}
			if !reflect.DeepEqual(r, tc.expectedRes) {
				t.Errorf("Unexpected result. Expected: %v, Actual: %v", tc.expectedRes, r)
			}
		})
	}
}
