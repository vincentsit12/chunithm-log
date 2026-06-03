import { MdCancel, MdChatBubble, MdCheck, MdMusicNote, MdPeople } from "react-icons/md";

export enum MessageType {
  CORRECT = "correct",
  WRONG = "wrong",
  JOIN_LEAVE = "joinLeave",
  ANSWER = "answer",
  NORMAL = "normal",
}

export interface ChatMessage {
  content: string;
  type: MessageType;
  timestamp?: number;
}

export const determineMessageType = (message: string): MessageType => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("correct") ||
    lowerMessage.includes("right") ||
    lowerMessage.includes("✓") ||
    lowerMessage.includes("✅")
  ) {
    return MessageType.CORRECT;
  }

  if (
    lowerMessage.includes("wrong") ||
    lowerMessage.includes("incorrect") ||
    lowerMessage.includes("failed") ||
    lowerMessage.includes("✗") ||
    lowerMessage.includes("❌")
  ) {
    return MessageType.WRONG;
  }

  if (
    lowerMessage.includes("joined") ||
    lowerMessage.includes("left") ||
    lowerMessage.includes("disconnected") ||
    lowerMessage.includes("connected") ||
    lowerMessage.includes("enter") ||
    lowerMessage.includes("exit")
  ) {
    return MessageType.JOIN_LEAVE;
  }

  if (
    lowerMessage.includes("answered") ||
    lowerMessage.includes("guessed") ||
    lowerMessage.includes("solution") ||
    lowerMessage.includes("answer is")
  ) {
    return MessageType.ANSWER;
  }

  return MessageType.NORMAL;
};

const ChatMessageComponent = ({ message }: { message: ChatMessage }) => {
  const getMessageStyle = (type: MessageType) => {
    switch (type) {
      case MessageType.CORRECT:
        return {
          bgColor: "bg-emerald-500/20",
          borderColor: "border-emerald-500/30",
          textColor: "text-emerald-300",
          icon: <MdCheck className="w-4 h-4 text-emerald-400" />,
        };
      case MessageType.WRONG:
        return {
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          textColor: "text-red-300",
          icon: <MdCancel className="w-4 h-4 text-red-400" />,
        };
      case MessageType.JOIN_LEAVE:
        return {
          bgColor: "bg-cyan-500/20",
          borderColor: "border-cyan-500/30",
          textColor: "text-cyan-300",
          icon: <MdPeople className="w-4 h-4 text-cyan-400" />,
        };
      case MessageType.ANSWER:
        return {
          bgColor: "bg-purple-500/20",
          borderColor: "border-purple-500/30",
          textColor: "text-purple-300",
          icon: <MdMusicNote className="w-4 h-4 text-purple-400" />,
        };
      case MessageType.NORMAL:
      default:
        return {
          bgColor: "bg-slate-500/10",
          borderColor: "border-slate-400/15",
          textColor: "text-slate-200",
          icon: <MdChatBubble className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const style = getMessageStyle(message.type);

  return (
    <div
      className={`${style.bgColor} ${style.borderColor} border rounded-lg p-3 mb-2 flex items-start gap-2`}
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <p className={`${style.textColor} text-sm leading-relaxed flex-1`}>
        {message.content}
      </p>
    </div>
  );
};

export default ChatMessageComponent;
