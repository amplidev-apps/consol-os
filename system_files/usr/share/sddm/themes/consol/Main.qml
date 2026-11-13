// Tema SDDM do Consol OS — fundo próprio, formulário centralizado.
// Testado para Fedora 44 (Qt 6). Para ativar, edite /etc/sddm.conf.d/consol.conf
// e rode: sudo systemctl restart sddm  (ou reinicie)
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: root
    color: "#0A0A0A"

    // Fundo
    Image {
        anchors.fill: parent
        source: "background.png"
        fillMode: Image.PreserveAspectCrop
        asynchronous: false
    }

    // Relógio discreto no canto superior
    Text {
        id: clock
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 32
        font.family: "Noto Sans"
        font.pixelSize: 22
        font.bold: true
        color: "#9BF00B"
        text: Qt.formatDateTime(new Date(), "HH:mm  ·  ddd, d MMM")

        Timer {
            interval: 1000
            running: true
            repeat: true
            onTriggered: clock.text = Qt.formatDateTime(new Date(), "HH:mm  ·  ddd, d MMM")
        }
    }

    // Formulário de login
    ColumnLayout {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.verticalCenter: parent.verticalCenter
        spacing: 14
        width: 340

        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "CONSOL OS"
            color: "#EEEEEE"
            font.family: "Noto Sans"
            font.bold: true
            font.pixelSize: 30
            font.letterSpacing: 6
        }

        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Faça login para continuar"
            color: "#8ED08E"
            font.pixelSize: 14
        }

        TextField {
            id: username
            Layout.fillWidth: true
            placeholderText: "Usuário"
            color: "#EEEEEE"
            placeholderTextColor: "#7a7a7a"
            selectedTextColor: "#0A0A0A"
            selectionColor: "#9BF00B"
            font.pixelSize: 16
            text: (sddm && sddm.currentUser) ? sddm.currentUser : ""
            background: Rectangle {
                color: "#161616"
                border.color: username.activeFocus ? "#107C10" : "#2a2a2a"
                border.width: 2
                radius: 8
            }
        }

        TextField {
            id: password
            Layout.fillWidth: true
            placeholderText: "Senha"
            echoMode: TextInput.Password
            color: "#EEEEEE"
            placeholderTextColor: "#7a7a7a"
            selectedTextColor: "#0A0A0A"
            selectionColor: "#9BF00B"
            font.pixelSize: 16
            onAccepted: login()
            background: Rectangle {
                color: "#161616"
                border.color: password.activeFocus ? "#107C10" : "#2a2a2a"
                border.width: 2
                radius: 8
            }
        }

        // Sessão (Plasma / KDE)
        ComboBox {
            id: sessionSelector
            Layout.fillWidth: true
            font.pixelSize: 13
            textRole: "name"
            model: sessionModel
            currentIndex: sessionModel.lastIndex
            background: Rectangle {
                color: "#161616"
                border.color: "#2a2a2a"
                border.width: 1
                radius: 8
            }
        }

        Button {
            Layout.fillWidth: true
            text: "Entrar"
            font.bold: true
            font.pixelSize: 16
            onClicked: login()
            background: Rectangle {
                color: "#107C10"
                radius: 8
            }
            contentItem: Text {
                text: parent.text
                color: "#FFFFFF"
                font: parent.font
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
        }
    }

    function login() {
        var chosen = sessionSelector.currentIndex >= 0 ? sessionSelector.currentIndex : 0
        sddm.login(username.text, password.text, chosen)
    }
}
