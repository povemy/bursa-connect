import { motion } from "framer-motion";
import { MarketPulse } from "@/components/dashboard/MarketPulse";
import { IntelligenceFeed } from "@/components/dashboard/IntelligenceFeed";
import { NewsRelationshipCloud } from "@/components/dashboard/NewsRelationshipCloud";
import { MarketMovers } from "@/components/dashboard/MarketMovers";

const Index = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MarketPulse />
      <IntelligenceFeed />
      <MarketMovers />
      <NewsRelationshipCloud />
    </motion.div>
  );
};

export default Index;
