<%
'On Error Resume Next

Function URLDecode(sConvert)
    Dim aSplit
    Dim sOutput
    Dim I
    If IsNull(sConvert) Then
       URLDecode = ""
       Exit Function
    End If

    ' convert all pluses to spaces
    sOutput = REPLACE(sConvert, "+", " ")

    ' next convert %hexdigits to the character
    aSplit = Split(sOutput, "%")

    If IsArray(aSplit) Then
      sOutput = aSplit(0)
      For I = 0 to UBound(aSplit) - 1
        sOutput = sOutput & _
          Chr("&H" & Left(aSplit(i + 1), 2)) &_
          Right(aSplit(i + 1), Len(aSplit(i + 1)) - 2)
      Next
    End If

    URLDecode = sOutput
End Function


method = Request.ServerVariables("REQUEST_METHOD")

Set gets = Request.QueryString

gets_split = Split(gets,"&")

pass = ""
url = ""
for each item in gets_split
	params = Split(item,"=")
	if (params(0) = "url") Then
		url = params(1)
		url = URLDecode(url)
	else
		if pass = "" Then
			pass = item
		else
			pass = pass & "&" & item
		end if
	end if
next


fullurl = url
if pass <> "" Then
	fullurl = url & "?" & pass
end if

Set HttpObj = Server.CreateObject("WinHttp.WinHttpRequest.5.1")		
HttpObj.Open method, fullurl
HttpObj.Send	
todoeltexto = HttpObj.ResponseText
	

response.write todoeltexto 
%>