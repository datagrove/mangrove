package x12

type KeyValue struct{ Key, Value string }

type Name struct {
	Fname  string
	Lname  string
	Mname  string
	Idqual string
	Id     string
}

func (x *Name) Nm1(Qual string, w *EdiWriter) {
	nm102 := "1"
	if len(x.Fname) == 0 {
		nm102 = "2"
	}
	w.Write("NM1", Qual, nm102, x.Lname, x.Fname, x.Mname, "", "", x.Idqual, x.Id)
}
func (x *Name) N1(Qual string, w *EdiWriter) {
	w.Write("N1", Qual, x.Lname, x.Idqual, x.Id)
}

type Address struct {
	Addr1 string
	Addr2 string
	City  string
	State string
	Zip   string
}

func (x *Address) N3N4(w *EdiWriter) {
	w.Write("N3", x.Addr1, x.Addr2)
	w.Write("N4", x.City, x.State, x.Zip)
}

type Demographic struct {
	Birth   string
	Gender  string
	Marital string
}

func (x *Demographic) Dmg(w *EdiWriter) {
	w.Write("DMG", "D8", x.Birth, x.Gender, x.Marital)
}

type Phone struct {
	Qual  string
	Phone string
}

func (x *Phone) Per(qual string, w *EdiWriter) {
	if len(x.Phone) > 0 {
		w.Write("PER", qual, "", x.Qual, x.Phone)
	}
}

/*
BG5 time code
AD //Alaska Daylight Time
AS //Alaska Standard Time
AT //Alaska Time
CD //Central Daylight Time
CS //Central Standard Time
CT //Central Time
ED //Eastern Daylight Time
ES //Eastern Standard Time
ET //Eastern Time
GM //Greenwich Mean Time
HD //Hawaii-Aleutian Daylight Time
HS //Hawaii-Aleutian Standard Time
HT //Hawaii-Aleutian Time
MD //Mountain Daylight Time
MS //Mountain Standard Time
MT //Mountain Time
PD //Pacific Daylight Time
PS //Pacific Standard Time
PT //Pacific Time
UT //Universal Time Coordinate
*/
